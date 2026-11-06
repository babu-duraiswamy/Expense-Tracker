import { notFound } from "next/navigation";
import { listActiveCategories } from "@/lib/categories/queries";
import { requireUserId } from "@/lib/auth/session";
import { getTransaction } from "@/lib/transactions/queries";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId();
  const transaction = await getTransaction(userId, id);
  if (!transaction) notFound();

  const [expenseCategories, incomeCategories] = await Promise.all([
    listActiveCategories(userId, "expense"),
    listActiveCategories(userId, "income"),
  ]);

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Edit transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionForm
            mode="edit"
            transaction={transaction}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
          />
        </CardContent>
      </Card>
    </div>
  );
}
