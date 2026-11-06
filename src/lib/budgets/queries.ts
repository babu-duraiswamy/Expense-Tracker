import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Budget } from "@/db/schema";
import { currentBudgetPeriod, daysLeftInPeriod, type DateWindow } from "./period";

export class BudgetNotFoundError extends Error {
  constructor() {
    super("Budget not found.");
  }
}

export type CreateBudgetInput = {
  name: string;
  amountMinor: number;
  scope: "total" | "categories";
  categoryIds?: string[];
  periodType: Budget["periodType"];
  startDate: string;
  endDate?: string;
};

export async function createBudget(userId: string, input: CreateBudgetInput): Promise<Budget> {
  const [row] = await db
    .insert(schema.budgets)
    .values({
      userId,
      name: input.name,
      amountMinor: input.amountMinor,
      scope: input.scope,
      periodType: input.periodType,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
    })
    .returning();

  if (input.scope === "categories" && input.categoryIds?.length) {
    await db
      .insert(schema.budgetCategories)
      .values(input.categoryIds.map((categoryId) => ({ budgetId: row!.id, categoryId })));
  }
  return row!;
}

export async function updateBudget(
  userId: string,
  id: string,
  input: CreateBudgetInput,
): Promise<Budget> {
  const [row] = await db
    .update(schema.budgets)
    .set({
      name: input.name,
      amountMinor: input.amountMinor,
      scope: input.scope,
      periodType: input.periodType,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
    })
    .where(and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)))
    .returning();
  if (!row) throw new BudgetNotFoundError();

  await db.delete(schema.budgetCategories).where(eq(schema.budgetCategories.budgetId, id));
  if (input.scope === "categories" && input.categoryIds?.length) {
    await db
      .insert(schema.budgetCategories)
      .values(input.categoryIds.map((categoryId) => ({ budgetId: id, categoryId })));
  }
  return row;
}

export async function setBudgetActive(
  userId: string,
  id: string,
  isActive: boolean,
): Promise<void> {
  const [row] = await db
    .update(schema.budgets)
    .set({ isActive })
    .where(and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)))
    .returning({ id: schema.budgets.id });
  if (!row) throw new BudgetNotFoundError();
}

export async function getBudgetCategoryIds(budgetId: string): Promise<string[]> {
  const rows = await db
    .select({ categoryId: schema.budgetCategories.categoryId })
    .from(schema.budgetCategories)
    .where(eq(schema.budgetCategories.budgetId, budgetId));
  return rows.map((r) => r.categoryId);
}

async function getSpendForWindow(
  userId: string,
  window: DateWindow,
  categoryIds: string[] | null,
): Promise<number> {
  const conditions = [
    eq(schema.transactions.userId, userId),
    eq(schema.transactions.type, "expense"),
    gte(schema.transactions.occurredOn, window.start),
    lte(schema.transactions.occurredOn, window.end),
  ];
  if (categoryIds) conditions.push(inArray(schema.transactions.categoryId, categoryIds));

  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${schema.transactions.amountMinor}), 0)` })
    .from(schema.transactions)
    .where(and(...conditions));
  return Number(row?.total ?? 0);
}

export type BudgetStatus = "ok" | "warning" | "over";

export type BudgetProgress = Budget & {
  window: DateWindow;
  spentMinor: number;
  remainingMinor: number;
  pctUsed: number;
  daysLeft: number;
  status: BudgetStatus;
  categoryIds: string[];
};

function statusFor(pctUsed: number): BudgetStatus {
  if (pctUsed >= 100) return "over";
  if (pctUsed >= 80) return "warning";
  return "ok";
}

export async function listBudgetsWithProgress(
  userId: string,
  today: string,
): Promise<BudgetProgress[]> {
  const budgets = await db
    .select()
    .from(schema.budgets)
    .where(and(eq(schema.budgets.userId, userId), eq(schema.budgets.isActive, true)));

  return Promise.all(
    budgets.map(async (budget) => {
      const window = currentBudgetPeriod(budget, today);
      const categoryIds =
        budget.scope === "categories" ? await getBudgetCategoryIds(budget.id) : [];
      const spentMinor = await getSpendForWindow(
        userId,
        window,
        budget.scope === "categories" ? categoryIds : null,
      );
      const pctUsed = budget.amountMinor > 0 ? (spentMinor / budget.amountMinor) * 100 : 0;
      return {
        ...budget,
        window,
        spentMinor,
        remainingMinor: budget.amountMinor - spentMinor,
        pctUsed,
        daysLeft: daysLeftInPeriod(window, today),
        status: statusFor(pctUsed),
        categoryIds,
      };
    }),
  );
}

export async function listInactiveBudgets(userId: string): Promise<Budget[]> {
  return db
    .select()
    .from(schema.budgets)
    .where(and(eq(schema.budgets.userId, userId), eq(schema.budgets.isActive, false)));
}

export async function getBudget(userId: string, id: string): Promise<Budget | undefined> {
  const [row] = await db
    .select()
    .from(schema.budgets)
    .where(and(eq(schema.budgets.id, id), eq(schema.budgets.userId, userId)));
  return row;
}
