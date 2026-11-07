"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/session";
import { createCategorySchema, updateCategorySchema } from "@/lib/categories/schema";
import { createCategory, setCategoryArchived, updateCategory } from "@/lib/categories/queries";

export async function createCategoryAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const userId = await requireUserId();

  const parsed = createCategorySchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    needOrWant: formData.get("needOrWant") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid category";

  try {
    await createCategory(userId, parsed.data);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not create category";
  }
  revalidatePath("/categories");
}

export async function updateCategoryAction(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  const userId = await requireUserId();

  const parsed = updateCategorySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    needOrWant: formData.get("needOrWant") || undefined,
  });
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid category";

  try {
    await updateCategory(userId, parsed.data.id, parsed.data);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not update category";
  }
  revalidatePath("/categories");
}

export async function setArchivedAction(id: string, isArchived: boolean): Promise<void> {
  const userId = await requireUserId();
  await setCategoryArchived(userId, id, isArchived);
  revalidatePath("/categories");
}

export type InlineCategory = {
  id: string;
  name: string;
  kind: "expense" | "income";
  needOrWant: "need" | "want" | null;
};

export async function createCategoryInlineAction(input: {
  name: string;
  kind: "expense" | "income";
  needOrWant?: "need" | "want";
}): Promise<{ ok: true; category: InlineCategory } | { ok: false; error: string }> {
  const userId = await requireUserId();
  const parsed = createCategorySchema.safeParse({
    name: input.name,
    kind: input.kind,
    needOrWant: input.kind === "expense" ? (input.needOrWant ?? "need") : undefined,
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid category" };

  try {
    const row = await createCategory(userId, parsed.data);
    revalidatePath("/categories");
    return {
      ok: true,
      category: { id: row.id, name: row.name, kind: row.kind, needOrWant: row.needOrWant },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create category",
    };
  }
}
