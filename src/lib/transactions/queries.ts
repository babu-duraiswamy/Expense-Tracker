import { and, desc, eq, gte, ilike, inArray, lte, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Category, Transaction } from "@/db/schema";

export class CategoryMismatchError extends Error {
  constructor() {
    super("Category does not belong to you or does not match the transaction type.");
  }
}

export class TransactionNotFoundError extends Error {
  constructor() {
    super("Transaction not found.");
  }
}

async function assertOwnedCategory(
  userId: string,
  categoryId: string,
  type: "expense" | "income",
): Promise<void> {
  const [category] = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(
      and(
        eq(schema.categories.id, categoryId),
        eq(schema.categories.userId, userId),
        eq(schema.categories.kind, type),
      ),
    );
  if (!category) throw new CategoryMismatchError();
}

export type CreateTransactionInput = {
  type: "expense" | "income";
  amountMinor: number;
  categoryId: string;
  occurredOn: string;
  paymentMode: Transaction["paymentMode"];
  note?: string;
};

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<Transaction> {
  await assertOwnedCategory(userId, input.categoryId, input.type);

  const [row] = await db
    .insert(schema.transactions)
    .values({
      userId,
      type: input.type,
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      categoryId: input.categoryId,
      paymentMode: input.paymentMode,
      note: input.note ?? null,
    })
    .returning();
  return row!;
}

export async function updateTransaction(
  userId: string,
  id: string,
  input: CreateTransactionInput,
): Promise<Transaction> {
  await assertOwnedCategory(userId, input.categoryId, input.type);

  const [row] = await db
    .update(schema.transactions)
    .set({
      type: input.type,
      amountMinor: input.amountMinor,
      occurredOn: input.occurredOn,
      categoryId: input.categoryId,
      paymentMode: input.paymentMode,
      note: input.note ?? null,
    })
    .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId)))
    .returning();
  if (!row) throw new TransactionNotFoundError();
  return row;
}

export async function deleteTransaction(userId: string, id: string): Promise<void> {
  const [row] = await db
    .delete(schema.transactions)
    .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId)))
    .returning({ id: schema.transactions.id });
  if (!row) throw new TransactionNotFoundError();
}

export async function getTransaction(userId: string, id: string): Promise<Transaction | undefined> {
  const [row] = await db
    .select()
    .from(schema.transactions)
    .where(and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId)));
  return row;
}

/** The most recently used payment mode, for defaulting the add-transaction form (FR-TXN-2). */
export async function getLastPaymentMode(
  userId: string,
): Promise<Transaction["paymentMode"] | undefined> {
  const [row] = await db
    .select({ paymentMode: schema.transactions.paymentMode })
    .from(schema.transactions)
    .where(eq(schema.transactions.userId, userId))
    .orderBy(desc(schema.transactions.createdAt))
    .limit(1);
  return row?.paymentMode;
}

export type TransactionFilters = {
  type?: "expense" | "income";
  categoryIds?: string[];
  paymentModes?: Transaction["paymentMode"][];
  note?: string;
  from?: string;
  to?: string;
};

function buildFilterConditions(userId: string, filters: TransactionFilters): SQL[] {
  const conditions: SQL[] = [eq(schema.transactions.userId, userId)];
  if (filters.type) conditions.push(eq(schema.transactions.type, filters.type));
  if (filters.categoryIds?.length) {
    conditions.push(inArray(schema.transactions.categoryId, filters.categoryIds));
  }
  if (filters.paymentModes?.length) {
    conditions.push(inArray(schema.transactions.paymentMode, filters.paymentModes));
  }
  if (filters.note) conditions.push(ilike(schema.transactions.note, `%${filters.note}%`));
  if (filters.from) conditions.push(gte(schema.transactions.occurredOn, filters.from));
  if (filters.to) conditions.push(lte(schema.transactions.occurredOn, filters.to));
  return conditions;
}

export type TransactionWithCategory = Transaction & { categoryName: string | null };

/** Newest first; excludes transfers from totals by construction (only expense/income are created). */
export async function listTransactions(
  userId: string,
  filters: TransactionFilters,
  pagination: { limit: number; offset: number },
): Promise<TransactionWithCategory[]> {
  const rows = await db
    .select({
      transaction: schema.transactions,
      categoryName: schema.categories.name,
    })
    .from(schema.transactions)
    .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
    .where(and(...buildFilterConditions(userId, filters)))
    .orderBy(desc(schema.transactions.occurredOn), desc(schema.transactions.createdAt))
    .limit(pagination.limit)
    .offset(pagination.offset);

  return rows.map((r) => ({ ...r.transaction, categoryName: r.categoryName }));
}

export type TransactionTotals = { incomeMinor: number; expenseMinor: number; netMinor: number };

export async function getTransactionTotals(
  userId: string,
  filters: TransactionFilters,
): Promise<TransactionTotals> {
  const rows = await db
    .select({
      type: schema.transactions.type,
      total: sql<string>`sum(${schema.transactions.amountMinor})`,
    })
    .from(schema.transactions)
    .where(and(...buildFilterConditions(userId, filters)))
    .groupBy(schema.transactions.type);

  const incomeMinor = Number(rows.find((r) => r.type === "income")?.total ?? 0);
  const expenseMinor = Number(rows.find((r) => r.type === "expense")?.total ?? 0);
  return { incomeMinor, expenseMinor, netMinor: incomeMinor - expenseMinor };
}

export async function listCategoriesForFilter(
  userId: string,
): Promise<Pick<Category, "id" | "name" | "kind">[]> {
  return db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      kind: schema.categories.kind,
    })
    .from(schema.categories)
    .where(eq(schema.categories.userId, userId));
}
