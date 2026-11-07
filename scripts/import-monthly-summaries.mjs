// Imports monthly category totals (e.g. exported from a phone expense app) as
// one transaction per category per month, dated the 1st of that month.
//
// Usage:
//   node scripts/import-monthly-summaries.mjs <path-to-json> [--email you@example.com]
//
// The JSON file shape is described in scripts/monthly-summaries.example.json.
// Re-running is safe: rows previously created by this script (matched by the
// tag in the note) are removed before the import is written again.

import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local", quiet: true });

const NAME_ALIASES = { "Personal Care": "Personal care", Miscellaneous: "Other" };
const NEW_EXPENSE_CATEGORIES = {
  Investment: "need",
  "Car expenses": "need",
  "For Home": "need",
  Fuel: "need",
  "Amma Medical": "need",
  "Appa spends": "need",
  "Paddlerz Coaching": "need",
  "Eating Out": "want",
  "Tea/Coffee": "want",
  "Nandavanam Expenses": "want",
};

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const emailFlag = args.indexOf("--email");
const email = emailFlag >= 0 ? args[emailFlag + 1] : process.env.AUTH_USER_EMAIL;

if (!file || !email) {
  console.error(
    "Usage: node scripts/import-monthly-summaries.mjs <file.json> [--email you@example.com]",
  );
  process.exit(1);
}

const data = JSON.parse(readFileSync(file, "utf8"));
const sql = neon(process.env.DATABASE_URL);

const [user] = await sql.query("select id from users where email = $1", [email]);
if (!user) {
  console.error(
    `No user ${email}. Sign in to the app once first so the account and categories exist.`,
  );
  process.exit(1);
}
const userId = user.id;

const removed = await sql.query(
  "delete from transactions where user_id = $1 and note = $2 returning id",
  [userId, data.tag],
);
console.log(`Removed ${removed.length} rows from a previous import.`);

const categoryNames = new Set(["Salary"]);
for (const m of data.months) {
  for (const name of Object.keys(m.categories)) categoryNames.add(NAME_ALIASES[name] ?? name);
}
for (const name of categoryNames) {
  if (name === "Salary") continue;
  const needOrWant = NEW_EXPENSE_CATEGORIES[name] ?? null;
  await sql.query(
    `insert into categories (user_id, name, kind, need_or_want)
     values ($1, $2, 'expense', $3)
     on conflict (user_id, kind, name) do nothing`,
    [userId, name, needOrWant],
  );
}

const categoryIds = new Map();
const rows = await sql.query("select id, name, kind from categories where user_id = $1", [userId]);
for (const r of rows) categoryIds.set(`${r.kind}:${r.name}`, r.id);

function expenseCategoryId(name) {
  const id = categoryIds.get(`expense:${NAME_ALIASES[name] ?? name}`);
  if (!id) throw new Error(`Missing expense category: ${name}`);
  return id;
}

let inserted = 0;
for (const m of data.months) {
  const occurredOn = `${m.month}-01`;

  if (m.income > 0) {
    const salaryId = categoryIds.get("income:Salary");
    if (!salaryId) throw new Error("Missing income category: Salary");
    await sql.query(
      `insert into transactions (user_id, type, amount_minor, occurred_on, category_id, payment_mode, note)
       values ($1, 'income', $2, $3, $4, 'net_banking', $5)`,
      [userId, m.income * 100, occurredOn, salaryId, data.tag],
    );
    inserted++;
  }

  for (const [name, amount] of Object.entries(m.categories)) {
    if (amount <= 0) continue;
    await sql.query(
      `insert into transactions (user_id, type, amount_minor, occurred_on, category_id, payment_mode, note)
       values ($1, 'expense', $2, $3, $4, 'cash', $5)`,
      [userId, amount * 100, occurredOn, expenseCategoryId(name), data.tag],
    );
    inserted++;
  }

  console.log(`${m.month}: imported (income ${m.income}, expense ${m.expenseTotal})`);
}

console.log(`Inserted ${inserted} transactions for ${email}.`);
