/** Shared constants. Values must match the enums in src/db/schema.ts. */

export const TIMEZONE = "Asia/Kolkata";
export const CURRENCY = "INR";

export const NEED_OR_WANT_LABELS = { need: "Need", want: "Want" } as const;

export const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "debit_card", label: "Debit card" },
  { value: "credit_card", label: "Credit card" },
  { value: "net_banking", label: "Net banking" },
  { value: "wallet", label: "Wallet" },
  { value: "cheque", label: "Cheque" },
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number]["value"];

/** Seeded on first sign-in (FR-CAT-1). Seeding must be idempotent. */
export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Entertainment", needOrWant: "want" },
  { name: "Travel", needOrWant: "want" },
  { name: "Personal care", needOrWant: "need" },
  { name: "Gifts", needOrWant: "want" },
  { name: "Other", needOrWant: "want" },
] as const;

export const DEFAULT_INCOME_CATEGORIES = ["Salary"] as const;
