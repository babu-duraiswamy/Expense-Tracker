// Imports monthly category totals (e.g. exported from a phone expense app) as
// one transaction per category per month, dated the 1st of that month.
//
// Usage:
//   node scripts/import-monthly-summaries.mjs <path-to-json> [--email you@example.com]
//
// Source category names are mapped onto the app's existing categories (see
// CATEGORY_MAP). The script never creates categories. Expenses are recorded
// as Cash and income as Net banking. Re-running is safe: rows previously
// created by this script (matched by the tag in the note) are removed first.

import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local", quiet: true });

const CATEGORY_MAP = {
  "Personal Care": "Personal care",
  Miscellaneous: "Other",
  "Car expenses": "Transport",
  Fuel: "Transport",
  "For Home": "Shopping",
  "Amma Medical": "Health",
  "Eating Out": "Food & dining",
  "Tea/Coffee": "Food & dining",
  "Appa spends": "Other",
  "Nandavanam Expenses": "Other",
  "Paddlerz Coaching": "Education",
  Investment: "Other",
};

const INCOME_CATEGORY = "Salary";

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

const categoryRows = await sql.query("select id, name, kind from categories where user_id = $1", [
  userId,
]);
const categoryId = (kind, name) => {
  const row = categoryRows.find((c) => c.kind === kind && c.name === name);
  if (!row) throw new Error(`No ${kind} category named "${name}" in the app.`);
  return row.id;
};

let inserted = 0;
for (const m of data.months) {
  const occurredOn = `${m.month}-01`;

  if (m.income > 0) {
    await sql.query(
      `insert into transactions (user_id, type, amount_minor, occurred_on, category_id, payment_mode, note)
       values ($1, 'income', $2, $3, $4, 'net_banking', $5)`,
      [userId, m.income * 100, occurredOn, categoryId("income", INCOME_CATEGORY), data.tag],
    );
    inserted++;
  }

  const perCategory = new Map();
  for (const [source, amount] of Object.entries(m.categories)) {
    const target = CATEGORY_MAP[source] ?? source;
    perCategory.set(target, (perCategory.get(target) ?? 0) + amount);
  }
  for (const [name, amount] of perCategory) {
    if (amount <= 0) continue;
    await sql.query(
      `insert into transactions (user_id, type, amount_minor, occurred_on, category_id, payment_mode, note)
       values ($1, 'expense', $2, $3, $4, 'cash', $5)`,
      [userId, amount * 100, occurredOn, categoryId("expense", name), data.tag],
    );
    inserted++;
  }

  console.log(`${m.month}: income ${m.income}, expense ${m.expenseTotal}`);
}

console.log(`Inserted ${inserted} transactions for ${email}.`);
