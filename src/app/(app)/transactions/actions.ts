"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth/session";
import { createTransactionSchema, updateTransactionSchema } from "@/lib/transactions/schema";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/transactions/queries";

export async function createTransactionAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const userId = await requireUserId();

  const parsed = createTransactionSchema.safeParse({
    type: formData.get("type"),
    amountMinor: formData.get("amountMinor"),
    categoryId: formData.get("categoryId"),
    occurredOn: formData.get("occurredOn"),
    paymentMode: formData.get("paymentMode"),
    note: formData.get("note"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid transaction";

  try {
    await createTransaction(userId, parsed.data);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not save transaction";
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  redirect("/transactions?added=1");
}

export async function updateTransactionAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const userId = await requireUserId();

  const parsed = updateTransactionSchema.safeParse({
    id: formData.get("id"),
    type: formData.get("type"),
    amountMinor: formData.get("amountMinor"),
    categoryId: formData.get("categoryId"),
    occurredOn: formData.get("occurredOn"),
    paymentMode: formData.get("paymentMode"),
    note: formData.get("note"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid transaction";

  try {
    await updateTransaction(userId, parsed.data.id, parsed.data);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not update transaction";
  }

  revalidatePath("/transactions");
  revalidatePath("/");
  redirect("/transactions?updated=1");
}

export async function deleteTransactionAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await deleteTransaction(userId, id);
  revalidatePath("/transactions");
  revalidatePath("/");
}
