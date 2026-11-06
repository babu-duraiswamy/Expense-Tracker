"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import { createBudgetSchema, updateBudgetSchema } from "@/lib/budgets/schema";
import { createBudget, setBudgetActive, updateBudget } from "@/lib/budgets/queries";

function parseFormData(formData: FormData) {
  return {
    name: formData.get("name"),
    amountMinor: formData.get("amountMinor"),
    scope: formData.get("scope"),
    categoryIds: formData.getAll("categoryIds"),
    periodType: formData.get("periodType"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  };
}

export async function createBudgetAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const userId = await requireUserId();
  const parsed = createBudgetSchema.safeParse(parseFormData(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid budget";

  try {
    await createBudget(userId, parsed.data);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not create budget";
  }
  revalidatePath("/budgets");
  revalidatePath("/");
}

export async function updateBudgetAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const userId = await requireUserId();
  const parsed = updateBudgetSchema.safeParse({
    ...parseFormData(formData),
    id: formData.get("id"),
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid budget";

  try {
    await updateBudget(userId, parsed.data.id, parsed.data);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not update budget";
  }
  revalidatePath("/budgets");
  revalidatePath("/");
}

export async function setBudgetActiveAction(id: string, isActive: boolean): Promise<void> {
  const userId = await requireUserId();
  await setBudgetActive(userId, id, isActive);
  revalidatePath("/budgets");
  revalidatePath("/");
}
