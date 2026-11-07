import { requireUserId } from "@/lib/auth/session";
import { listCategories } from "@/lib/categories/queries";
import { AddCategoryForm } from "./add-category-form";
import { CategoryRow } from "./category-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// F-CAT-01. Settings-area hub for categories will consolidate under F-SET-01.
export default async function CategoriesPage() {
  const userId = await requireUserId();
  const categories = await listCategories(userId);
  const expense = categories.filter((c) => c.kind === "expense");
  const income = categories.filter((c) => c.kind === "income");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Categories</h1>
        <p className="text-muted-foreground text-sm">
          Organise your transactions. Expense categories carry a Need/Want tag used in reports.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense</CardTitle>
        </CardHeader>
        <CardContent className="divide-border flex flex-col divide-y">
          {expense.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
          <div className="pt-3">
            <AddCategoryForm kind="expense" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income</CardTitle>
        </CardHeader>
        <CardContent className="divide-border flex flex-col divide-y">
          {income.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
          <div className="pt-3">
            <AddCategoryForm kind="income" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
