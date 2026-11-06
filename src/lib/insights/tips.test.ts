import { describe, expect, it } from "vitest";
import { rankInsights, renderTip } from "./tips";
import type { Insight } from "./rules";

describe("renderTip", () => {
  it("renders biggest_mover with real figures", () => {
    const insight: Insight = {
      key: "biggest_mover",
      severity: "info",
      data: {
        categoryName: "Food & dining",
        deltaMinor: 450_00,
        prevMinor: 200_00,
        currentMinor: 650_00,
      },
      impactPaise: 450_00,
    };
    expect(renderTip(insight)).toBe(
      "Food & dining: up ₹450.00 vs the previous period (₹200.00 → ₹650.00).",
    );
  });

  it("renders share_of_wallet", () => {
    const insight: Insight = {
      key: "share_of_wallet",
      severity: "info",
      data: { categoryName: "Rent", share: 0.42, totalMinor: 4_200_00 },
      impactPaise: 4_200_00,
    };
    expect(renderTip(insight)).toBe("Rent is 42% of your spend this period (₹4,200.00).");
  });

  it("renders small_leaks with an annualised impact", () => {
    const insight: Insight = {
      key: "small_leaks",
      severity: "info",
      data: { categoryName: "Coffee", count: 18, totalMinor: 6_400_00, annualisedMinor: 45_00_000 },
      impactPaise: 45_00_000,
    };
    expect(renderTip(insight)).toBe(
      "Coffee: 18 small purchases totalling ₹6,400.00 this period. Cutting these could save ≈ ₹45,000.00/year.",
    );
  });

  it("renders budget_risk when over", () => {
    const insight: Insight = {
      key: "budget_risk",
      severity: "critical",
      data: { name: "Food budget", pctUsed: 112, status: "over", overMinor: 150_00 },
      impactPaise: 150_00,
    };
    expect(renderTip(insight)).toBe('"Food budget" budget is over by ₹150.00.');
  });

  it("returns an empty string for an unknown key instead of throwing", () => {
    const insight: Insight = { key: "unknown_key", severity: "info", data: {}, impactPaise: 0 };
    expect(renderTip(insight)).toBe("");
  });
});

describe("rankInsights", () => {
  it("sorts by impact descending and limits the count", () => {
    const insights: Insight[] = [
      { key: "a", severity: "info", data: {}, impactPaise: 100 },
      { key: "b", severity: "info", data: {}, impactPaise: 500 },
      { key: "c", severity: "info", data: {}, impactPaise: 200 },
    ];
    const ranked = rankInsights(insights, 2);
    expect(ranked.map((i) => i.key)).toEqual(["b", "c"]);
  });
});
