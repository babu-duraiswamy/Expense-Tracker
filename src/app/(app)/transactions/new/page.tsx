import { requireUserId } from "@/lib/auth/session";
import { listActiveCategories } from "@/lib/categories/queries";
import { todayIST } from "@/lib/dates";
import { getLastPaymentMode } from "@/lib/transactions/queries";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const userId = await requireUserId();
  const [expenseCategories, incomeCategories, lastPaymentMode] = await Promise.all([
    listActiveCategories(userId, "expense"),
    listActiveCategories(userId, "income"),
    getLastPaymentMode(userId),
  ]);

  return (
    <div className="mx-auto max-w-lg">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Add transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            mode="create"
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            today={todayIST()}
            defaultPaymentMode={lastPaymentMode ?? "cash"}
            defaultType={type === "income" ? "income" : "expense"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
