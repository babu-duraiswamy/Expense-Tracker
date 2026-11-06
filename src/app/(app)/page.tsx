import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { auth } from "@/auth";
import { requireUserId } from "@/lib/auth/session";
import { formatINR } from "@/lib/money";
import { thisMonth } from "@/lib/periods";
import { todayIST } from "@/lib/dates";
import { getPeriodSummary } from "@/lib/reports/queries";
import { listBudgetsWithProgress } from "@/lib/budgets/queries";
import { listTransactions } from "@/lib/transactions/queries";
import { computeInsightsForPeriod } from "@/lib/insights/engine";
import { rankInsights, renderTip } from "@/lib/insights/tips";
import { PAYMENT_MODES } from "@/lib/constants";
import { BudgetCard } from "@/components/budgets/budget-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PAYMENT_MODE_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_MODES.map((m) => [m.value, m.label]),
);

export default async function Home() {
  const session = await auth();
  const userId = await requireUserId();
  const period = thisMonth();
  const today = todayIST();

  const [summary, budgets, insights, recentTransactions] = await Promise.all([
    getPeriodSummary(userId, period),
    listBudgetsWithProgress(userId, today),
    computeInsightsForPeriod(userId, period),
    listTransactions(userId, {}, { limit: 5, offset: 0 }),
  ]);

  const topTips = rankInsights(insights, 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Signed in as {session?.user?.email} · {period.label}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Income</span>
            <span className="text-lg font-semibold text-emerald-600">
              {formatINR(summary.incomeMinor)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Expense</span>
            <span className="text-destructive text-lg font-semibold">
              {formatINR(summary.expenseMinor)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Net savings</span>
            <span className="text-lg font-semibold">{formatINR(summary.netMinor)}</span>
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
            <CardTitle>Top tips</CardTitle>
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

      {budgets.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-medium">Budgets</h2>
            <Link
              href="/budgets"
              className="text-primary flex items-center gap-1 text-sm hover:underline"
            >
              View all
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {budgets.slice(0, 4).map((b) => (
              <BudgetCard key={b.id} budget={b} />
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent transactions</span>
            <Link
              href="/transactions"
              className="text-primary flex items-center gap-1 text-sm hover:underline"
            >
              View all
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-border flex flex-col divide-y">
          {recentTransactions.length === 0 && (
            <p className="text-muted-foreground py-4 text-sm">No transactions yet.</p>
          )}
          {recentTransactions.map((t) => (
            <Link
              key={t.id}
              href={`/transactions/${t.id}/edit`}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {t.categoryName ?? "Uncategorised"}
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Badge variant="secondary" className="text-[10px]">
                    {PAYMENT_MODE_LABELS[t.paymentMode]}
                  </Badge>
                  {new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
                    new Date(`${t.occurredOn}T00:00:00`),
                  )}
                </span>
              </span>
              <span
                className={`shrink-0 font-semibold ${t.type === "income" ? "text-emerald-600" : "text-destructive"}`}
              >
                {t.type === "income" ? "+" : "−"}
                {formatINR(t.amountMinor)}
              </span>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
