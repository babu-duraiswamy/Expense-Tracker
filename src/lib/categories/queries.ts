import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from "@/lib/constants";
import { isUniqueViolation } from "@/lib/pg-error";
import type { Category } from "@/db/schema";

export class DuplicateCategoryError extends Error {
  constructor() {
    super("A category with this name already exists.");
  }
}

export class CategoryNotFoundError extends Error {
  constructor() {
    super("Category not found.");
  }
}

/** Seeds the FR-CAT-1 defaults on first sign-in. Idempotent. */
export async function seedDefaultCategories(userId: string): Promise<void> {
  const rows = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
      userId,
      name: c.name,
      kind: "expense" as const,
      needOrWant: c.needOrWant,
      sortOrder: i,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((name, i) => ({
      userId,
      name,
      kind: "income" as const,
      sortOrder: i,
    })),
  ];
  await db
    .insert(schema.categories)
    .values(rows)
    .onConflictDoNothing({
      target: [schema.categories.userId, schema.categories.kind, schema.categories.name],
    });
}

export async function listCategories(userId: string): Promise<Category[]> {
  return db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.userId, userId))
    .orderBy(
      asc(schema.categories.kind),
      asc(schema.categories.sortOrder),
      asc(schema.categories.name),
    );
}

export async function createCategory(
  userId: string,
  input: { name: string; kind: "expense" | "income"; needOrWant?: "need" | "want" },
): Promise<Category> {
  try {
    const [row] = await db
      .insert(schema.categories)
      .values({
        userId,
        name: input.name,
        kind: input.kind,
        needOrWant: input.kind === "expense" ? (input.needOrWant ?? null) : null,
      })
      .returning();
    return row!;
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateCategoryError();
    throw error;
  }
}

export async function updateCategory(
  userId: string,
  id: string,
  input: { name: string; needOrWant?: "need" | "want" },
): Promise<Category> {
  try {
    const [row] = await db
      .update(schema.categories)
      .set({ name: input.name, needOrWant: input.needOrWant })
      .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, userId)))
      .returning();
    if (!row) throw new CategoryNotFoundError();
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) throw new DuplicateCategoryError();
    throw error;
  }
}

export async function setCategoryArchived(
  userId: string,
  id: string,
  isArchived: boolean,
): Promise<Category> {
  const [row] = await db
    .update(schema.categories)
    .set({ isArchived })
    .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, userId)))
    .returning();
  if (!row) throw new CategoryNotFoundError();
  return row;
}
