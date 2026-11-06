/**
 * Database schema — see docs/RAD.md §6.3.
 *
 * Rules (enforced here and in code):
 * - Money is integer paise in `bigint` columns (₹249.50 → 24950). Never floats.
 * - `occurred_on` is a calendar date in IST, not a timestamp.
 * - Every table that holds user data has `user_id`; every query must filter on it.
 * - Transfers are excluded from income/expense totals, budgets and insights.
 *
 * Note: the `accounts` table here means *money* accounts (bank, card, wallet).
 * Auth.js runs with JWT sessions and NO database adapter, so there is no clash
 * with Auth.js's own "accounts" table.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------

export const accountTypeEnum = pgEnum("account_type", [
  "cash",
  "bank_account",
  "credit_card",
  "wallet",
  // later: "brokerage", "mutual_fund", "demat"
]);

export const categoryKindEnum = pgEnum("category_kind", ["expense", "income"]);

export const needOrWantEnum = pgEnum("need_or_want", ["need", "want"]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "expense",
  "income",
  "transfer",
  // later: "buy", "sell", "dividend", "interest"
]);

export const paymentModeEnum = pgEnum("payment_mode", [
  "cash",
  "upi",
  "debit_card",
  "credit_card",
  "net_banking",
  "wallet",
  "cheque",
]);

export const budgetScopeEnum = pgEnum("budget_scope", ["total", "categories"]);

export const budgetPeriodEnum = pgEnum("budget_period", [
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
]);

// ---------- Shared columns ----------

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

// ---------- Tables ----------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  defaultPaymentMode: paymentModeEnum("default_payment_mode"),
  ...timestamps,
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: accountTypeEnum("type").notNull(),
    currency: text("currency").notNull().default("INR"),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [uniqueIndex("accounts_user_name_uq").on(t.userId, t.name)],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: categoryKindEnum("kind").notNull(),
    needOrWant: needOrWantEnum("need_or_want"), // expense categories only
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    isArchived: boolean("is_archived").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("categories_user_kind_name_uq").on(t.userId, t.kind, t.name),
    check(
      "categories_need_or_want_expense_only",
      sql`${t.kind} = 'expense' OR ${t.needOrWant} IS NULL`,
    ),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: transactionTypeEnum("type").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("INR"),
    occurredOn: date("occurred_on", { mode: "string" }).notNull(), // "YYYY-MM-DD", IST
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "restrict",
    }),
    paymentMode: paymentModeEnum("payment_mode").notNull(),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    toAccountId: uuid("to_account_id").references(() => accounts.id, { onDelete: "set null" }),
    note: text("note"),
    // later (investments): instrumentId, quantity, unitPriceMinor, feesMinor — see RAD §7
    ...timestamps,
  },
  (t) => [
    index("transactions_user_date_idx").on(t.userId, t.occurredOn),
    index("transactions_user_category_date_idx").on(t.userId, t.categoryId, t.occurredOn),
    check("transactions_amount_positive", sql`${t.amountMinor} > 0`),
    check(
      "transactions_category_required",
      sql`${t.type} = 'transfer' OR ${t.categoryId} IS NOT NULL`,
    ),
    check(
      "transactions_to_account_transfer_only",
      sql`${t.type} = 'transfer' OR ${t.toAccountId} IS NULL`,
    ),
  ],
);

export const budgets = pgTable(
  "budgets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amountMinor: bigint("amount_minor", { mode: "number" }).notNull(),
    scope: budgetScopeEnum("scope").notNull(),
    periodType: budgetPeriodEnum("period_type").notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }), // null = recurs indefinitely
    rollover: boolean("rollover").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("budgets_user_idx").on(t.userId),
    check("budgets_amount_positive", sql`${t.amountMinor} > 0`),
    check(
      "budgets_custom_needs_end",
      sql`${t.periodType} <> 'custom' OR ${t.endDate} IS NOT NULL`,
    ),
  ],
);

export const budgetCategories = pgTable(
  "budget_categories",
  {
    budgetId: uuid("budget_id")
      .notNull()
      .references(() => budgets.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.budgetId, t.categoryId] })],
);

// ---------- Inferred types ----------

export type User = typeof users.$inferSelect;
export type Account = typeof accounts.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;
