"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import { formatINR, paiseToInput } from "@/lib/money";
import { createTransactionSchema } from "@/lib/transactions/schema";
import { createTransaction, CategoryMismatchError } from "@/lib/transactions/queries";

export type QuickAddInput = {
  type: "expense" | "income";
  amountMinor: number;
  categoryId: string | null;
  occurredOn: string;
  paymentMode: string;
};

export async function addTransactionQuickAction(
  input: QuickAddInput,
): Promise<{ ok: true; summary: string } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const parsed = createTransactionSchema.safeParse({
    type: input.type,
    amountMinor: paiseToInput(input.amountMinor),
    categoryId: input.categoryId ?? "",
    occurredOn: input.occurredOn,
    paymentMode: input.paymentMode,
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the entry" };

  try {
    await createTransaction(userId, parsed.data);
  } catch (error) {
    if (error instanceof CategoryMismatchError) return { ok: false, error: error.message };
    return { ok: false, error: "Could not save the transaction. Please try again." };
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  return {
    ok: true,
    summary: `Added ${formatINR(input.amountMinor)} ${input.type === "income" ? "income" : "expense"}`,
  };
}
