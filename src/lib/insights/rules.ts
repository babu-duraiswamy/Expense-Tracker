/**
 * Insight engine (F-INS-01). Pure functions over a period's already-aggregated
 * data — no DB, no UI, no AI. Every rule suppresses itself when there isn't
 * enough data rather than showing a misleading tip (FR-INS-12).
 */
import type { CategoryBreakdownRow } from "@/lib/reports/queries";
import type { BudgetProgress } from "@/lib/budgets/queries";

export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  key: string;
  severity: InsightSeverity;
  data: Record<string, unknown>;
  /** ₹ paise used to rank tips — annualised where meaningful, absolute otherwise. */
  impactPaise: number;
}

/** Categories with the largest ₹ increase vs the previous period. */
export function biggestMovers(
  current: CategoryBreakdownRow[],
  previous: CategoryBreakdownRow[],
): Insight[] {
  const prevByCategory = new Map(previous.map((r) => [r.categoryId, r.totalMinor]));
  const movers = current
    .map((r) => {
      const prevMinor = prevByCategory.get(r.categoryId) ?? 0;
      return {
        categoryName: r.categoryName,
        currentMinor: r.totalMinor,
        prevMinor,
        deltaMinor: r.totalMinor - prevMinor,
      };
    })
    .filter((r) => r.prevMinor > 0 && r.deltaMinor > 0)
    .sort((a, b) => b.deltaMinor - a.deltaMinor);

  if (movers.length === 0) return [];
  const top = movers[0]!;
  return [
    {
      key: "biggest_mover",
      severity: "info",
      data: top,
      impactPaise: top.deltaMinor,
    },
  ];
}

/** The category taking a disproportionate share of total spend. */
export function shareOfWallet(current: CategoryBreakdownRow[]): Insight[] {
  const total = current.reduce((sum, r) => sum + r.totalMinor, 0);
  if (total === 0) return [];
  const top = [...current].sort((a, b) => b.totalMinor - a.totalMinor)[0]!;
  const share = top.totalMinor / total;
  if (share < 0.25) return [];
  return [
    {
      key: "share_of_wallet",
      severity: "info",
      data: { categoryName: top.categoryName, share, totalMinor: top.totalMinor },
      impactPaise: top.totalMinor,
    },
  ];
}

/** Compares the needs/wants split against the 50/30/20 guideline (of income). */
export function needsWantsGuideline(
  incomeMinor: number,
  needMinor: number,
  wantMinor: number,
): Insight[] {
  if (incomeMinor <= 0) return [];
  const needPct = needMinor / incomeMinor;
  const wantPct = wantMinor / incomeMinor;
  const overNeed = Math.max(0, needMinor - incomeMinor * 0.5);
  const overWant = Math.max(0, wantMinor - incomeMinor * 0.3);
  if (overNeed === 0 && overWant === 0) return [];
  return [
    {
      key: "needs_wants_guideline",
      severity: "warning",
      data: { needPct, wantPct, overNeed: overNeed > 0, overWant: overWant > 0 },
      impactPaise: overNeed + overWant,
    },
  ];
}

/** Categories with several small transactions that add up — candidates to cut. */
export function smallLeaks(
  groups: { categoryName: string; count: number; totalMinor: number }[],
  periodDays: number,
): Insight[] {
  const candidates = groups.filter((g) => g.count >= 3);
  if (candidates.length === 0 || periodDays <= 0) return [];
  const top = [...candidates].sort((a, b) => b.totalMinor - a.totalMinor)[0]!;
  const annualisedMinor = Math.round((top.totalMinor / periodDays) * 365);
  return [
    {
      key: "small_leaks",
      severity: "info",
      data: { ...top, annualisedMinor },
      impactPaise: annualisedMinor,
    },
  ];
}

/** Month-by-month savings-rate direction. Needs at least 2 months with income. */
export function savingsRateTrend(
  monthly: { month: string; incomeMinor: number; expenseMinor: number }[],
): Insight[] {
  const withIncome = monthly.filter((m) => m.incomeMinor > 0);
  if (withIncome.length < 2) return [];
  const rates = withIncome.map((m) => (m.incomeMinor - m.expenseMinor) / m.incomeMinor);
  const first = rates[0]!;
  const last = rates[rates.length - 1]!;
  const deltaPct = (last - first) * 100;
  if (Math.abs(deltaPct) < 1) return [];
  return [
    {
      key: "savings_rate_trend",
      severity: deltaPct < 0 ? "warning" : "info",
      data: { deltaPct, firstRate: first, lastRate: last, months: withIncome.length },
      impactPaise: 0,
    },
  ];
}

/** Budgets that are near or over their limit. */
export function budgetRisk(budgets: BudgetProgress[]): Insight[] {
  return budgets
    .filter((b) => b.status !== "ok")
    .map((b) => ({
      key: "budget_risk",
      severity: (b.status === "over" ? "critical" : "warning") as InsightSeverity,
      data: {
        name: b.name,
        pctUsed: b.pctUsed,
        status: b.status,
        overMinor: Math.max(0, -b.remainingMinor),
      },
      impactPaise: Math.max(0, -b.remainingMinor) || b.spentMinor,
    }));
}
