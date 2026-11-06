import { describe, expect, it } from "vitest";
import {
  biggestMovers,
  budgetRisk,
  needsWantsGuideline,
  savingsRateTrend,
  shareOfWallet,
  smallLeaks,
} from "./rules";
import type { CategoryBreakdownRow } from "@/lib/reports/queries";
import type { BudgetProgress } from "@/lib/budgets/queries";

function category(
  name: string,
  totalMinor: number,
  needOrWant: "need" | "want" | null = null,
): CategoryBreakdownRow {
  return { categoryId: name, categoryName: name, needOrWant, totalMinor };
}

describe("biggestMovers", () => {
  it("flags the category with the largest increase", () => {
    const current = [category("Food", 50_00), category("Travel", 10_00)];
    const previous = [category("Food", 20_00), category("Travel", 10_00)];
    const result = biggestMovers(current, previous);
    expect(result).toHaveLength(1);
    expect(result[0]!.data).toMatchObject({ categoryName: "Food", deltaMinor: 30_00 });
  });

  it("suppresses when nothing increased", () => {
    const current = [category("Food", 10_00)];
    const previous = [category("Food", 20_00)];
    expect(biggestMovers(current, previous)).toHaveLength(0);
  });

  it("ignores a brand-new category with no prior baseline (avoids noisy 'infinite increase')", () => {
    const current = [category("NewCat", 50_00)];
    const previous: CategoryBreakdownRow[] = [];
    expect(biggestMovers(current, previous)).toHaveLength(0);
  });
});

describe("shareOfWallet", () => {
  it("flags a category that dominates spend", () => {
    const result = shareOfWallet([category("Rent", 80_00), category("Food", 20_00)]);
    expect(result).toHaveLength(1);
    expect(result[0]!.data).toMatchObject({ categoryName: "Rent" });
  });

  it("suppresses when spend is well-distributed", () => {
    const result = shareOfWallet([
      category("A", 20_00),
      category("B", 20_00),
      category("C", 20_00),
      category("D", 20_00),
      category("E", 20_00),
    ]);
    expect(result).toHaveLength(0);
  });

  it("suppresses when there is no spend at all", () => {
    expect(shareOfWallet([])).toHaveLength(0);
  });
});

describe("needsWantsGuideline", () => {
  it("flags needs over 50% of income", () => {
    const result = needsWantsGuideline(100_00, 60_00, 10_00);
    expect(result).toHaveLength(1);
    expect(result[0]!.data).toMatchObject({ overNeed: true, overWant: false });
  });

  it("suppresses when within the 50/30/20 guideline", () => {
    expect(needsWantsGuideline(100_00, 40_00, 20_00)).toHaveLength(0);
  });

  it("suppresses when there is no income data", () => {
    expect(needsWantsGuideline(0, 60_00, 10_00)).toHaveLength(0);
  });
});

describe("smallLeaks", () => {
  it("flags a category with several small transactions and annualises the cost", () => {
    const result = smallLeaks([{ categoryName: "Coffee", count: 10, totalMinor: 3000 }], 30);
    expect(result).toHaveLength(1);
    expect(result[0]!.data).toMatchObject({ categoryName: "Coffee", annualisedMinor: 36_500 });
  });

  it("suppresses a category with too few transactions to call a pattern", () => {
    expect(smallLeaks([{ categoryName: "Coffee", count: 2, totalMinor: 600 }], 30)).toHaveLength(0);
  });

  it("suppresses when there is no data", () => {
    expect(smallLeaks([], 30)).toHaveLength(0);
  });
});

describe("savingsRateTrend", () => {
  it("flags a declining savings rate across months", () => {
    const result = savingsRateTrend([
      { month: "2026-01", incomeMinor: 100_00, expenseMinor: 50_00 },
      { month: "2026-02", incomeMinor: 100_00, expenseMinor: 80_00 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]!.severity).toBe("warning");
  });

  it("suppresses with fewer than two months of income data (FR-INS-12)", () => {
    expect(
      savingsRateTrend([{ month: "2026-01", incomeMinor: 100_00, expenseMinor: 50_00 }]),
    ).toHaveLength(0);
  });

  it("suppresses a negligible change", () => {
    const result = savingsRateTrend([
      { month: "2026-01", incomeMinor: 100_00, expenseMinor: 50_00 },
      { month: "2026-02", incomeMinor: 100_00, expenseMinor: 50_50 },
    ]);
    expect(result).toHaveLength(0);
  });
});

describe("budgetRisk", () => {
  function budget(overrides: Partial<BudgetProgress>): BudgetProgress {
    return {
      id: "b1",
      userId: "u1",
      name: "Food",
      amountMinor: 10_000,
      scope: "total",
      periodType: "monthly",
      startDate: "2026-01-01",
      endDate: null,
      rollover: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      window: { start: "2026-01-01", end: "2026-01-31" },
      spentMinor: 10_000,
      remainingMinor: 0,
      pctUsed: 100,
      daysLeft: 1,
      status: "over",
      categoryIds: [],
      ...overrides,
    };
  }

  it("flags budgets that are over", () => {
    const result = budgetRisk([budget({ status: "over", remainingMinor: -500 })]);
    expect(result).toHaveLength(1);
    expect(result[0]!.severity).toBe("critical");
  });

  it("ignores budgets that are on track", () => {
    expect(budgetRisk([budget({ status: "ok", pctUsed: 10, remainingMinor: 9000 })])).toHaveLength(
      0,
    );
  });
});
