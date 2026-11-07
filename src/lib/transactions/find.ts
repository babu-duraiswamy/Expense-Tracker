import { and, desc, eq, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

export type TransactionMatchQuery = {
  amountMinor: number | null;
  categoryId: string | null;
  occurredOn: string | null;
};

export type TransactionMatch = {
  id: string;
  type: "expense" | "income";
  amountMinor: number;
  occurredOn: string;
  paymentMode: string;
  note: string | null;
  categoryName: string | null;
};

/** Finds transactions the user may want to delete. Always scoped to the signed-in user. */
export async function findTransactionMatches(
  userId: string,
  query: TransactionMatchQuery,
  limit = 10,
): Promise<TransactionMatch[]> {
  const conditions: SQL[] = [eq(schema.transactions.userId, userId)];
  if (query.amountMinor !== null)
    conditions.push(eq(schema.transactions.amountMinor, query.amountMinor));
  if (query.categoryId !== null)
    conditions.push(eq(schema.transactions.categoryId, query.categoryId));
  if (query.occurredOn !== null)
    conditions.push(eq(schema.transactions.occurredOn, query.occurredOn));

  const rows = await db
    .select({
      id: schema.transactions.id,
      type: schema.transactions.type,
      amountMinor: schema.transactions.amountMinor,
      occurredOn: schema.transactions.occurredOn,
      paymentMode: schema.transactions.paymentMode,
      note: schema.transactions.note,
      categoryName: schema.categories.name,
    })
    .from(schema.transactions)
    .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
    .where(and(...conditions))
    .orderBy(desc(schema.transactions.occurredOn), desc(schema.transactions.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    type: r.type === "income" ? "income" : "expense",
    amountMinor: Number(r.amountMinor),
  }));
}
