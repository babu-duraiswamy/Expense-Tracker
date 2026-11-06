import { formatINR } from "@/lib/money";
import type { Insight } from "./rules";

/** One template per insight key (F-INS-02), real figures + ₹ impact. */
export function renderTip(insight: Insight): string {
  const d = insight.data as Record<string, number | string | boolean | undefined>;
  switch (insight.key) {
    case "biggest_mover":
      return `${d.categoryName}: up ${formatINR(d.deltaMinor as number)} vs the previous period (${formatINR(
        d.prevMinor as number,
      )} → ${formatINR(d.currentMinor as number)}).`;
    case "share_of_wallet":
      return `${d.categoryName} is ${Math.round((d.share as number) * 100)}% of your spend this period (${formatINR(
        d.totalMinor as number,
      )}).`;
    case "needs_wants_guideline":
      return `Your needs/wants split is above the 50/30/20 guideline by ${formatINR(insight.impactPaise)}${
        d.overNeed && d.overWant ? " (both needs and wants)" : d.overNeed ? " (needs)" : " (wants)"
      }.`;
    case "small_leaks":
      return `${d.categoryName}: ${d.count} small purchases totalling ${formatINR(
        d.totalMinor as number,
      )} this period. Cutting these could save ≈ ${formatINR(d.annualisedMinor as number)}/year.`;
    case "savings_rate_trend":
      return `Your savings rate ${(d.deltaPct as number) < 0 ? "dropped" : "improved"} by ${Math.abs(
        Math.round(d.deltaPct as number),
      )} percentage point(s) over the last ${d.months} months.`;
    case "budget_risk":
      return d.status === "over"
        ? `"${d.name}" budget is over by ${formatINR(d.overMinor as number)}.`
        : `"${d.name}" budget is at ${Math.round(d.pctUsed as number)}% — close to the limit.`;
    default:
      return "";
  }
}

/** Ranked by ₹ impact, top N (FR-INS-11). */
export function rankInsights(insights: Insight[], limit = 5): Insight[] {
  return [...insights].sort((a, b) => b.impactPaise - a.impactPaise).slice(0, limit);
}
