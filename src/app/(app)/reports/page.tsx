import { requireUserId } from "@/lib/auth/session";
import { formatINR, percentChange } from "@/lib/money";
import {
  type Period,
  enumerateMonths,
  lastMonth,
  previousPeriod,
  thisCalendarYear,
  thisFinancialYear,
  thisMonth,
  thisQuarterFY,
  customPeriod,
} from "@/lib/periods";
import {
  getCategoryBreakdown,
  getMonthlyTrend,
  getNeedsVsWants,
  getPaymentModeSplit,
  getPeriodSummary,
  getTopExpenses,
} from "@/lib/reports/queries";
import { PAYMENT_MODES } from "@/lib/constants";
import { computeInsightsForPeriod } from "@/lib/insights/engine";
import { rankInsights, renderTip } from "@/lib/insights/tips";
import { PeriodPicker } from "./period-picker";
import { TrendChart } from "./trend-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAYMENT_MODE_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_MODES.map((m) => [m.value, m.label]),
);

function resolvePeriod(sp: Record<string, string | undefined>): { period: Period; preset: string } {
  if (sp.preset === "custom" && sp.from && sp.to) {
    return { period: customPeriod(sp.from, sp.to), preset: "custom" };
  }
  switch (sp.preset) {
    case "last_month":
      return { period: lastMonth(), preset: "last_month" };
    case "this_quarter_fy":
      return { period: thisQuarterFY(), preset: "this_quarter_fy" };
    case "this_fy":
      return { period: thisFinancialYear(), preset: "this_fy" };
    case "this_year":
      return { period: thisCalendarYear(), preset: "this_year" };
    default:
      return { period: thisMonth(), preset: "this_month" };
  }
}

function ChangeBadge({ prev, curr }: { prev: number; curr: number }) {
  const pct = percentChange(prev, curr);
  if (pct === null) return null;
  const isIncrease = pct > 0;
  return (
    <span className={`text-xs font-medium ${isIncrease ? "text-destructive" : "text-emerald-600"}`}>
      {isIncrease ? "+" : ""}
      {pct.toFixed(0)}% vs previous
    </span>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const userId = await requireUserId();
  const { period, preset } = resolvePeriod(sp);
  const previous = previousPeriod(period);
  const months = enumerateMonths(period.start, period.end);

  const [
    summary,
    prevSummary,
    expenseByCategory,
    paymentModeSplit,
    needsVsWants,
    topExpenses,
    trend,
    insights,
  ] = await Promise.all([
    getPeriodSummary(userId, period),
    getPeriodSummary(userId, previous),
    getCategoryBreakdown(userId, period, "expense"),
    getPaymentModeSplit(userId, period),
    getNeedsVsWants(userId, period),
    getTopExpenses(userId, period, 5),
    months.length > 1 ? getMonthlyTrend(userId, period) : Promise.resolve([]),
    computeInsightsForPeriod(userId, period),
  ]);

  const totalExpense = summary.expenseMinor;
  const needWantTotal = needsVsWants.needMinor + needsVsWants.wantMinor;
  const topTips = rankInsights(insights, 5);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground text-sm">
          Income, spend and savings for any period, compared with the one before it.
        </p>
      </div>

      <PeriodPicker activePreset={preset} period={period} />

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Income</span>
            <span className="text-lg font-semibold text-emerald-600">
              {formatINR(summary.incomeMinor)}
            </span>
            <ChangeBadge prev={prevSummary.incomeMinor} curr={summary.incomeMinor} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Expense</span>
            <span className="text-destructive text-lg font-semibold">
              {formatINR(summary.expenseMinor)}
            </span>
            <ChangeBadge prev={prevSummary.expenseMinor} curr={summary.expenseMinor} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Net savings</span>
            <span className="text-lg font-semibold">{formatINR(summary.netMinor)}</span>
            <ChangeBadge prev={prevSummary.netMinor} curr={summary.netMinor} />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Savings rate</span>
            <span className="text-lg font-semibold">
              {summary.savingsRate === null ? "—" : `${(summary.savingsRate * 100).toFixed(0)}%`}
            </span>
          </CardContent>
        </Card>
      </div>

      {topTips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tips for this period</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {topTips.map((insight, i) => (
              <div key={`${insight.key}-${i}`} className="flex items-start gap-2 text-sm">
                <Badge
                  variant={
                    insight.severity === "critical"
                      ? "destructive"
                      : insight.severity === "warning"
                        ? "secondary"
                        : "outline"
                  }
                  className="mt-0.5 shrink-0"
                >
                  {insight.severity}
                </Badge>
                <span>{renderTip(insight)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {months.length > 1 && trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense by category</CardTitle>
          </CardHeader>
          <CardContent className="divide-border flex flex-col divide-y">
            {expenseByCategory.length === 0 && (
              <p className="text-muted-foreground py-4 text-sm">No expenses in this period.</p>
            )}
            {expenseByCategory.map((row) => (
              <div key={row.categoryId} className="flex items-center justify-between gap-3 py-2">
                <span className="flex items-center gap-2 text-sm">
                  {row.categoryName}
                  {row.needOrWant && (
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {row.needOrWant}
                    </Badge>
                  )}
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{formatINR(row.totalMinor)}</span>
                  <span className="text-muted-foreground w-10 text-right text-xs">
                    {totalExpense > 0
                      ? `${((row.totalMinor / totalExpense) * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment mode split</CardTitle>
          </CardHeader>
          <CardContent className="divide-border flex flex-col divide-y">
            {paymentModeSplit.length === 0 && (
              <p className="text-muted-foreground py-4 text-sm">No expenses in this period.</p>
            )}
            {paymentModeSplit.map((row) => (
              <div key={row.paymentMode} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm">
                  {PAYMENT_MODE_LABELS[row.paymentMode] ?? row.paymentMode}
                </span>
                <span className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{formatINR(row.totalMinor)}</span>
                  <span className="text-muted-foreground w-10 text-right text-xs">
                    {totalExpense > 0
                      ? `${((row.totalMinor / totalExpense) * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs vs wants</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {needWantTotal === 0 ? (
              <p className="text-muted-foreground text-sm">No tagged expenses in this period.</p>
            ) : (
              <>
                <div className="bg-muted flex h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary"
                    style={{ width: `${(needsVsWants.needMinor / needWantTotal) * 100}%` }}
                  />
                  <div
                    className="bg-muted-foreground/40"
                    style={{ width: `${(needsVsWants.wantMinor / needWantTotal) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span>
                    Need — {formatINR(needsVsWants.needMinor)} (
                    {((needsVsWants.needMinor / needWantTotal) * 100).toFixed(0)}%)
                  </span>
                  <span>
                    Want — {formatINR(needsVsWants.wantMinor)} (
                    {((needsVsWants.wantMinor / needWantTotal) * 100).toFixed(0)}%)
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 expenses</CardTitle>
          </CardHeader>
          <CardContent className="divide-border flex flex-col divide-y">
            {topExpenses.length === 0 && (
              <p className="text-muted-foreground py-4 text-sm">No expenses in this period.</p>
            )}
            {topExpenses.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2">
                <span className="flex flex-col">
                  <span className="text-sm">{t.categoryName}</span>
                  <span className="text-muted-foreground text-xs">
                    {new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
                      new Date(`${t.occurredOn}T00:00:00`),
                    )}
                    {t.note ? ` · ${t.note}` : ""}
                  </span>
                </span>
                <span className="text-destructive text-sm font-semibold">
                  {formatINR(t.amountMinor)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
