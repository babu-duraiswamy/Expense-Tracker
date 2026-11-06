import type { Period } from "@/lib/periods";
import { periodLengthDays, previousPeriod } from "@/lib/periods";
import {
  getCategoryBreakdown,
  getMonthlyTrend,
  getNeedsVsWants,
  getPeriodSummary,
  getSmallTransactionGroups,
} from "@/lib/reports/queries";
import { listBudgetsWithProgress } from "@/lib/budgets/queries";
import { todayIST } from "@/lib/dates";
import {
  biggestMovers,
  budgetRisk,
  needsWantsGuideline,
  savingsRateTrend,
  shareOfWallet,
  smallLeaks,
  type Insight,
} from "./rules";

/** Runs the full insight engine for any period (F-INS-01). */
export async function computeInsightsForPeriod(userId: string, period: Period): Promise<Insight[]> {
  const previous = previousPeriod(period);
  const today = todayIST();

  const [
    currentBreakdown,
    previousBreakdown,
    summary,
    needsVsWants,
    smallGroups,
    monthlyTrend,
    budgets,
  ] = await Promise.all([
    getCategoryBreakdown(userId, period, "expense"),
    getCategoryBreakdown(userId, previous, "expense"),
    getPeriodSummary(userId, period),
    getNeedsVsWants(userId, period),
    getSmallTransactionGroups(userId, period),
    getMonthlyTrend(userId, period),
    listBudgetsWithProgress(userId, today),
  ]);

  return [
    ...biggestMovers(currentBreakdown, previousBreakdown),
    ...shareOfWallet(currentBreakdown),
    ...needsWantsGuideline(summary.incomeMinor, needsVsWants.needMinor, needsVsWants.wantMinor),
    ...smallLeaks(smallGroups, periodLengthDays(period)),
    ...savingsRateTrend(monthlyTrend),
    ...budgetRisk(budgets),
  ];
}
