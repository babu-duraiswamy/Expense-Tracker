import { and, desc, eq, gte, lte, ne, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Period } from "@/lib/periods";
import { enumerateMonths } from "@/lib/periods";

/** Transfers are excluded from every report rule (rule 4). */
function periodConditions(userId: string, period: Period): SQL {
  return and(
    eq(schema.transactions.userId, userId),
    ne(schema.transactions.type, "transfer"),
    gte(schema.transactions.occurredOn, period.start),
    lte(schema.transactions.occurredOn, period.end),
  )!;
}

export type PeriodSummary = {
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
  savingsRate: number | null;
};

export async function getPeriodSummary(userId: string, period: Period): Promise<PeriodSummary> {
  const rows = await db
    .select({
      type: schema.transactions.type,
      total: sql<string>`sum(${schema.transactions.amountMinor})`,
    })
    .from(schema.transactions)
    .where(periodConditions(userId, period))
    .groupBy(schema.transactions.type);

  const incomeMinor = Number(rows.find((r) => r.type === "income")?.total ?? 0);
  const expenseMinor = Number(rows.find((r) => r.type === "expense")?.total ?? 0);
  const netMinor = incomeMinor - expenseMinor;
  const savingsRate = incomeMinor > 0 ? netMinor / incomeMinor : null;
  return { incomeMinor, expenseMinor, netMinor, savingsRate };
}

export type CategoryBreakdownRow = {
  categoryId: string;
  categoryName: string;
  needOrWant: "need" | "want" | null;
  totalMinor: number;
};

export async function getCategoryBreakdown(
  userId: string,
  period: Period,
  kind: "expense" | "income" = "expense",
): Promise<CategoryBreakdownRow[]> {
  const rows = await db
    .select({
      categoryId: schema.transactions.categoryId,
      categoryName: schema.categories.name,
      needOrWant: schema.categories.needOrWant,
      total: sql<string>`sum(${schema.transactions.amountMinor})`,
    })
    .from(schema.transactions)
    .innerJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
    .where(and(periodConditions(userId, period), eq(schema.transactions.type, kind)))
    .groupBy(schema.transactions.categoryId, schema.categories.name, schema.categories.needOrWant)
    .orderBy(desc(sql`sum(${schema.transactions.amountMinor})`));

  return rows.map((r) => ({
    categoryId: r.categoryId!,
    categoryName: r.categoryName,
    needOrWant: r.needOrWant,
    totalMinor: Number(r.total),
  }));
}

export type PaymentModeSplitRow = { paymentMode: string; totalMinor: number };

export async function getPaymentModeSplit(
  userId: string,
  period: Period,
): Promise<PaymentModeSplitRow[]> {
  const rows = await db
    .select({
      paymentMode: schema.transactions.paymentMode,
      total: sql<string>`sum(${schema.transactions.amountMinor})`,
    })
    .from(schema.transactions)
    .where(and(periodConditions(userId, period), eq(schema.transactions.type, "expense")))
    .groupBy(schema.transactions.paymentMode)
    .orderBy(desc(sql`sum(${schema.transactions.amountMinor})`));

  return rows.map((r) => ({ paymentMode: r.paymentMode, totalMinor: Number(r.total) }));
}

export async function getNeedsVsWants(
  userId: string,
  period: Period,
): Promise<{ needMinor: number; wantMinor: number }> {
  const rows = await getCategoryBreakdown(userId, period, "expense");
  let needMinor = 0;
  let wantMinor = 0;
  for (const r of rows) {
    if (r.needOrWant === "need") needMinor += r.totalMinor;
    else if (r.needOrWant === "want") wantMinor += r.totalMinor;
  }
  return { needMinor, wantMinor };
}

export type TopExpenseRow = {
  id: string;
  categoryName: string;
  occurredOn: string;
  amountMinor: number;
  note: string | null;
};

export async function getTopExpenses(
  userId: string,
  period: Period,
  limit = 5,
): Promise<TopExpenseRow[]> {
  const rows = await db
    .select({
      id: schema.transactions.id,
      categoryName: schema.categories.name,
      occurredOn: schema.transactions.occurredOn,
      amountMinor: schema.transactions.amountMinor,
      note: schema.transactions.note,
    })
    .from(schema.transactions)
    .leftJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
    .where(and(periodConditions(userId, period), eq(schema.transactions.type, "expense")))
    .orderBy(desc(schema.transactions.amountMinor))
    .limit(limit);

  return rows.map((r) => ({ ...r, categoryName: r.categoryName ?? "Uncategorised" }));
}

export type MonthlyTrendRow = { month: string; incomeMinor: number; expenseMinor: number };

/** Month-by-month income vs expense; months with no data show as zero (FR-RPT-5). */
export async function getMonthlyTrend(userId: string, period: Period): Promise<MonthlyTrendRow[]> {
  const rows = await db
    .select({
      month: sql<string>`to_char(${schema.transactions.occurredOn}, 'YYYY-MM')`,
      type: schema.transactions.type,
      total: sql<string>`sum(${schema.transactions.amountMinor})`,
    })
    .from(schema.transactions)
    .where(periodConditions(userId, period))
    .groupBy(sql`to_char(${schema.transactions.occurredOn}, 'YYYY-MM')`, schema.transactions.type);

  return enumerateMonths(period.start, period.end).map((month) => ({
    month,
    incomeMinor: Number(rows.find((r) => r.month === month && r.type === "income")?.total ?? 0),
    expenseMinor: Number(rows.find((r) => r.month === month && r.type === "expense")?.total ?? 0),
  }));
}

export type SmallTransactionGroup = { categoryName: string; count: number; totalMinor: number };

/** Expense categories with several small transactions (F-INS-01 small-leaks input). */
export async function getSmallTransactionGroups(
  userId: string,
  period: Period,
  maxAmountMinor = 30_000,
): Promise<SmallTransactionGroup[]> {
  const rows = await db
    .select({
      categoryName: schema.categories.name,
      count: sql<string>`count(*)`,
      total: sql<string>`sum(${schema.transactions.amountMinor})`,
    })
    .from(schema.transactions)
    .innerJoin(schema.categories, eq(schema.transactions.categoryId, schema.categories.id))
    .where(
      and(
        periodConditions(userId, period),
        eq(schema.transactions.type, "expense"),
        lte(schema.transactions.amountMinor, maxAmountMinor),
      ),
    )
    .groupBy(schema.categories.name);

  return rows.map((r) => ({
    categoryName: r.categoryName,
    count: Number(r.count),
    totalMinor: Number(r.total),
  }));
}
