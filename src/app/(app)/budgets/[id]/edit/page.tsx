import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth/session";
import { listActiveCategories } from "@/lib/categories/queries";
import { getBudget, getBudgetCategoryIds } from "@/lib/budgets/queries";
import { BudgetForm } from "@/components/budgets/budget-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const budget = await getBudget(userId, id);
  if (!budget) notFound();

  const [categoryIds, expenseCategories] = await Promise.all([
    getBudgetCategoryIds(id),
    listActiveCategories(userId, "expense"),
  ]);

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Edit budget</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetForm expenseCategories={expenseCategories} budget={{ ...budget, categoryIds }} />
        </CardContent>
      </Card>
    </div>
  );
}
