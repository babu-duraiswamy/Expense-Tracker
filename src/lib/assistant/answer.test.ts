import { describe, expect, it } from "vitest";
import { answer, type AssistantData } from "./answer";

const base: AssistantData = {
  label: "July 2026",
  previousLabel: "June 2026",
  periodGiven: true,
  summary: { incomeMinor: 450000, expenseMinor: 5393800, netMinor: -4943800, savingsRate: null },
  previousSummary: {
    incomeMinor: 330000,
    expenseMinor: 8299300,
    netMinor: -7969300,
    savingsRate: null,
  },
  expenseByCategory: [
    { categoryName: "For Home", needOrWant: "need", totalMinor: 1643100 },
    { categoryName: "Eating Out", needOrWant: "want", totalMinor: 430400 },
    { categoryName: "Gifts", needOrWant: "want", totalMinor: 152400 },
  ],
  previousExpenseByCategory: [
    { categoryName: "Eating Out", totalMinor: 630200 },
    { categoryName: "Gifts", totalMinor: 50000 },
  ],
  incomeBySource: [{ categoryName: "Salary", totalMinor: 450000 }],
  topTransactions: [
    { categoryName: "For Home", occurredOn: "2026-07-05", amountMinor: 500000, note: "Paint" },
  ],
  smallLeaks: [{ categoryName: "Tea/Coffee", count: 6, totalMinor: 60200 }],
  budgets: [],
};

describe("answer", () => {
  it("lists the biggest categories with their share", () => {
    const text = answer("topCategories", base);
    expect(text).toContain("For Home: ₹16,431.00");
    expect(text.split("\n")[1]).toMatch(/^1\. For Home/);
  });

  it("estimates savings from cutting 30% of wants and ignores needs", () => {
    const text = answer("avoidable", base);
    expect(text).toContain("Eating Out: ₹4,304.00");
    expect(text).not.toContain("For Home: ₹");
    // 30% of 4304 + 30% of 1524 = 1291.20 + 457.20 -> 1748.40
    expect(text).toContain("₹1,748.40");
  });

  it("flags a rising category only when it crosses both thresholds", () => {
    const text = answer("avoidable", base);
    expect(text).toContain("rose sharply");
    expect(text).toContain("- Gifts: up");
    expect(text).not.toContain("- Eating Out: up"); // fell versus last month
    expect(text).not.toContain("- For Home: up"); // no baseline last month
  });

  it("reports a comparison with the previous period", () => {
    const text = answer("compare", base);
    expect(text).toContain("June 2026");
    expect(text).toContain("Expenses:");
  });

  it("labels imported monthly totals as such rather than as purchases", () => {
    const imported: AssistantData = {
      ...base,
      topTransactions: [
        {
          categoryName: "Fuel",
          occurredOn: "2026-07-01",
          amountMinor: 923800,
          note: "Imported monthly total (phone app)",
        },
      ],
    };
    const text = answer("topTransactions", imported);
    expect(text).toContain("monthly total from your phone app");
    expect(text).toContain("not single purchases");
  });

  it("says when there is nothing recorded", () => {
    const empty: AssistantData = {
      ...base,
      summary: { incomeMinor: 0, expenseMinor: 0, netMinor: 0, savingsRate: null },
      expenseByCategory: [],
    };
    expect(answer("totals", empty)).toBe("Nothing has been recorded for July 2026.");
  });

  it("notes when the default period was used", () => {
    expect(answer("totals", { ...base, periodGiven: false })).toContain("the default period");
  });

  it("explains that savings can't be computed without income", () => {
    const noIncome: AssistantData = { ...base, summary: { ...base.summary, incomeMinor: 0 } };
    expect(answer("savings", noIncome)).toContain("can't work out a savings rate");
  });
});
