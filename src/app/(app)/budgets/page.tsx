import { requireUserId } from "@/lib/auth/session";
import { listActiveCategories } from "@/lib/categories/queries";
import { listBudgetsWithProgress, listInactiveBudgets } from "@/lib/budgets/queries";
import { todayIST } from "@/lib/dates";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetCard } from "@/components/budgets/budget-card";
import { PausedBudgetRow } from "@/components/budgets/paused-budget-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BudgetsPage() {
  const userId = await requireUserId();
  const today = todayIST();

  const [budgets, pausedBudgets, expenseCategories] = await Promise.all([
    listBudgetsWithProgress(userId, today),
    listInactiveBudgets(userId),
    listActiveCategories(userId, "expense"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-muted-foreground text-sm">
          Set a limit for total spend or specific categories, for any period.
        </p>
      </div>

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            No active budgets yet. Create one below.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} />
          ))}
        </div>
      )}

      {pausedBudgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paused</CardTitle>
          </CardHeader>
          <CardContent className="divide-border flex flex-col divide-y">
            {pausedBudgets.map((b) => (
              <PausedBudgetRow key={b.id} budget={b} />
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>New budget</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm expenseCategories={expenseCategories} />
        </CardContent>
      </Card>
    </div>
  );
}
