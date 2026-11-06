import Link from "next/link";
import { requireUserId } from "@/lib/auth/session";
import { listCategories } from "@/lib/categories/queries";
import { AddCategoryForm } from "./add-category-form";
import { CategoryRow } from "./category-row";

// F-CAT-01. Settings-area hub for categories will consolidate under F-SET-01.
export default async function CategoriesPage() {
  const userId = await requireUserId();
  const categories = await listCategories(userId);
  const expense = categories.filter((c) => c.kind === "expense");
  const income = categories.filter((c) => c.kind === "income");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link href="/" className="text-sm text-neutral-500">
        ← Dashboard
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Categories</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-medium">Expense</h2>
        <div className="mb-4">
          {expense.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </div>
        <AddCategoryForm kind="expense" />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">Income</h2>
        <div className="mb-4">
          {income.map((c) => (
            <CategoryRow key={c.id} category={c} />
          ))}
        </div>
        <AddCategoryForm kind="income" />
      </section>
    </main>
  );
}
