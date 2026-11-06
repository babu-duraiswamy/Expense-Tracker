import { z } from "zod";
import { amountMinorSchema } from "@/lib/money-schema";

export const transactionTypeSchema = z.enum(["expense", "income"]);

export const paymentModeSchema = z.enum([
  "cash",
  "upi",
  "debit_card",
  "credit_card",
  "net_banking",
  "wallet",
  "cheque",
]);

const occurredOnSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");

const noteSchema = z
  .literal("")
  .transform(() => undefined as string | undefined)
  .or(z.string().trim().max(280, "Keep the note under 280 characters"))
  .optional();

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amountMinor: amountMinorSchema,
  categoryId: z.string().uuid("Choose a category"),
  occurredOn: occurredOnSchema,
  paymentMode: paymentModeSchema,
  note: noteSchema,
});

export const updateTransactionSchema = createTransactionSchema.extend({
  id: z.string().uuid(),
});
