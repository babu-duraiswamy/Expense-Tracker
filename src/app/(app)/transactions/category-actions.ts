"use server";

import { z } from "zod";
import { requireUserId } from "@/lib/auth/session";
import { listTransactions } from "@/lib/transactions/queries";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const querySchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1).max(100),
  from: dateString,
  to: dateString,
});

export type CategoryTransaction = {
  id: string;
  occurredOn: string;
  amountMinor: number;
  categoryName: string | null;
  paymentMode: string;
  note: string | null;
};

/** Expenses for the given categories in a date range, newest first. Scoped to the signed-in user. */
export async function listCategoryTransactionsAction(
  input: z.input<typeof querySchema>,
): Promise<CategoryTransaction[]> {
  const userId = await requireUserId();
  const { categoryIds, from, to } = querySchema.parse(input);
  const rows = await listTransactions(
    userId,
    { type: "expense", categoryIds, from, to },
    { limit: 200, offset: 0 },
  );
  return rows.map((r) => ({
    id: r.id,
    occurredOn: r.occurredOn,
    amountMinor: r.amountMinor,
    categoryName: r.categoryName,
    paymentMode: r.paymentMode,
    note: r.note,
  }));
}
