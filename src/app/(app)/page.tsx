import Link from "next/link";
import {
  ArrowRightIcon,
  PiggyBankIcon,
  PlusIcon,
  ReceiptTextIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { requireUserId } from "@/lib/auth/session";
import { formatINR, percentChange } from "@/lib/money";
import { customPeriod, monthPeriod, previousPeriod, thisMonth } from "@/lib/periods";
import { todayIST } from "@/lib/dates";
import { getCategoryBreakdown, getMonthlyTrend, getPeriodSummary } from "@/lib/reports/queries";
import { listBudgetsWithProgress } from "@/lib/budgets/queries";
import { listTransactions } from "@/lib/transactions/queries";
import { computeInsightsForPeriod } from "@/lib/insights/engine";
import { rankInsights, renderTip } from "@/lib/insights/tips";
import { PAYMENT_MODES } from "@/lib/constants";
import { CategoryDonut, TrendBars } from "@/components/dashboard/charts";
import { StatCard } from "@/components/dashboard/stat-card";
import { BudgetCard } from "@/components/budgets/budget-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAYMENT_MODE_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_MODES.map((m) => [m.value, m.label]),
);

const dayFormat = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" });
const longDate = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Kolkata",
});

function greeting(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(email: string | null | undefined): string {
  const local = email?.split("@")[0] ?? "there";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function sixMonthWindow(today: string) {
  const [y, m] = today.split("-").map(Number) as [number, number];
  return customPeriod(monthPeriod(y, m - 5).start, thisMonth(today).end);
}

export default async function Home() {
  const userId = await requireUserId();
  const today = todayIST();
  const now = new Date();
  const period = thisMonth(today);
  const previous = previousPeriod(period);
  const window = sixMonthWindow(today);

  const [summary, prevSummary, trend, breakdown, budgets, insights, recent, session] =
    await Promise.all([
      getPeriodSummary(userId, period),
      getPeriodSummary(userId, previous),
      getMonthlyTrend(userId, window),
      getCategoryBreakdown(userId, period, "expense"),
      listBudgetsWithProgress(userId, today),
      computeInsightsForPeriod(userId, period),
      listTransactions(userId, {}, { limit: 6, offset: 0 }),
      auth(),
    ]);

  const topTips = rankInsights(insights, 3);

  const topCategories = breakdown
    .slice(0, 5)
    .map((c) => ({ name: c.categoryName, totalMinor: c.totalMinor }));
  const restMinor = breakdown.slice(5).reduce((sum, c) => sum + c.totalMinor, 0);
  if (restMinor > 0) topCategories.push({ name: "Other", totalMinor: restMinor });

  const prevRate = prevSummary.savingsRate;
  const rateDelta =
    summary.savingsRate !== null && prevRate !== null
      ? (summary.savingsRate - prevRate) * 100
      : null;

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{longDate.format(now)}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting(now)}, {firstName(session?.user?.email)}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Here is where {period.label} stands.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/transactions/new?type=expense"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-1.5 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50",
            )}
          >
            <PlusIcon className="size-4" />
            Expense
          </Link>
          <Link
            href="/transactions/new?type=income"
            className={cn(
              buttonVariants(),
              "gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700",
            )}
          >
            <PlusIcon className="size-4" />
            Income
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Income"
          value={formatINR(summary.incomeMinor)}
          icon={TrendingUpIcon}
          tone="income"
          delta={percentChange(prevSummary.incomeMinor, summary.incomeMinor)}
        />
        <StatCard
          label="Expenses"
          value={formatINR(summary.expenseMinor)}
          icon={TrendingDownIcon}
          tone="expense"
          higherIsBad
          delta={percentChange(prevSummary.expenseMinor, summary.expenseMinor)}
        />
        <StatCard
          label="Net savings"
          value={formatINR(summary.netMinor)}
          icon={WalletIcon}
          tone="accent"
          delta={percentChange(prevSummary.netMinor, summary.netMinor)}
        />
        <StatCard
          label="Savings rate"
          value={summary.savingsRate === null ? "—" : `${(summary.savingsRate * 100).toFixed(0)}%`}
          icon={PiggyBankIcon}
          tone="neutral"
          delta={rateDelta}
          footnote={prevRate === null ? "no income last month" : "points vs last month"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Income vs expenses</CardTitle>
              <p className="text-muted-foreground text-xs">Last six months</p>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <TrendBars data={trend} />
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Where it went</CardTitle>
            <p className="text-muted-foreground text-xs">Top categories this month</p>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="text-muted-foreground py-10 text-center text-sm">
                No expenses yet this month.
              </p>
            ) : (
              <CategoryDonut data={topCategories} />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Budgets</h2>
            <Link
              href="/budgets"
              className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
            >
              Manage <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
          {budgets.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  Set a budget to keep an eye on a category or your total spend.
                </p>
                <Link
                  href="/budgets"
                  className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
                >
                  Create a budget
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {budgets.slice(0, 4).map((b) => (
                <BudgetCard key={b.id} budget={b} />
              ))}
            </div>
          )}
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base">Worth a look</CardTitle>
            <p className="text-muted-foreground text-xs">Ranked by rupee impact</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topTips.length === 0 && (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Nothing to flag yet. Keep logging and tips will appear here.
              </p>
            )}
            {topTips.map((insight, i) => (
              <div
                key={`${insight.key}-${i}`}
                className="bg-muted/50 flex items-start gap-3 rounded-xl p-3 text-sm"
              >
                <Badge
                  variant={
                    insight.severity === "critical"
                      ? "destructive"
                      : insight.severity === "warning"
                        ? "secondary"
                        : "outline"
                  }
                  className="mt-0.5 shrink-0 capitalize"
                >
                  {insight.severity}
                </Badge>
                <span className="leading-snug">{renderTip(insight)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Recent activity</CardTitle>
          <Link
            href="/transactions"
            className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
          >
            View all <ArrowRightIcon className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="flex flex-col">
          {recent.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ReceiptTextIcon className="text-muted-foreground size-8" />
              <p className="text-muted-foreground text-sm">
                No transactions yet. Add your first one to get started.
              </p>
            </div>
          )}
          {recent.map((t) => (
            <Link
              key={t.id}
              href={`/transactions/${t.id}/edit`}
              className="hover:bg-muted/50 -mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition-colors"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    t.type === "income"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-rose-500/10 text-rose-600",
                  )}
                >
                  {(t.categoryName ?? "?").charAt(0).toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {t.categoryName ?? "Uncategorised"}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    {dayFormat.format(new Date(`${t.occurredOn}T00:00:00`))}
                    <span>·</span>
                    {PAYMENT_MODE_LABELS[t.paymentMode]}
                    {t.note ? <span className="truncate">· {t.note}</span> : null}
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-sm font-semibold tabular-nums",
                  t.type === "income" ? "text-emerald-600" : "text-foreground",
                )}
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
