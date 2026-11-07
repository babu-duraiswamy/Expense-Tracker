import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { requireUserId } from "@/lib/auth/session";
import { formatINR } from "@/lib/money";
import { PAYMENT_MODES, type PaymentMode } from "@/lib/constants";
import {
  getTransactionTotals,
  listCategoriesForFilter,
  listTransactions,
  type TransactionFilters as Filters,
  type TransactionWithCategory,
} from "@/lib/transactions/queries";
import { TransactionFilters } from "./filters";
import { DeleteButton } from "./delete-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;
const PAYMENT_MODE_LABELS: Record<string, string> = Object.fromEntries(
  PAYMENT_MODES.map((m) => [m.value, m.label]),
);

function groupByDate(
  transactions: TransactionWithCategory[],
): [string, TransactionWithCategory[]][] {
  const groups = new Map<string, TransactionWithCategory[]>();
  for (const t of transactions) {
    const list = groups.get(t.occurredOn) ?? [];
    list.push(t);
    groups.set(t.occurredOn, list);
  }
  return [...groups.entries()];
}

function formatDateHeading(isoDate: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${isoDate}T00:00:00`));
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const userId = await requireUserId();

  const filters: Filters = {
    type: sp.type === "expense" || sp.type === "income" ? sp.type : undefined,
    categoryIds: sp.category?.split(",").filter(Boolean),
    paymentModes: sp.mode?.split(",").filter(Boolean) as PaymentMode[] | undefined,
    note: sp.q,
    from: sp.from,
    to: sp.to,
  };
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [transactions, totals, categories] = await Promise.all([
    listTransactions(userId, filters, { limit: PAGE_SIZE, offset }),
    getTransactionTotals(userId, filters),
    listCategoriesForFilter(userId),
  ]);

  const grouped = groupByDate(transactions);
  const hasFilters = Object.values(sp).some(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            All your income and expenses, newest first.
          </p>
        </div>
        <Link href="/transactions/new" className={cn(buttonVariants(), "gap-1.5")}>
          <PlusIcon />
          Add
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Income</span>
            <span className="text-lg font-semibold text-emerald-600">
              {formatINR(totals.incomeMinor)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Expense</span>
            <span className="text-destructive text-lg font-semibold">
              {formatINR(totals.expenseMinor)}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">Net</span>
            <span className="text-lg font-semibold">{formatINR(totals.netMinor)}</span>
          </CardContent>
        </Card>
      </div>

      <TransactionFilters categories={categories} />

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-muted-foreground">
              {hasFilters ? "No transactions match these filters." : "No transactions yet."}
            </p>
            {!hasFilters && (
              <Link href="/transactions/new" className={cn(buttonVariants(), "gap-1.5")}>
                <PlusIcon />
                Add your first transaction
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <h2 className="text-muted-foreground mb-1.5 text-xs font-medium">
                {formatDateHeading(date)}
              </h2>
              <Card>
                <CardContent className="divide-border flex flex-col divide-y">
                  {items.map((t) => (
                    <div key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                      <Link
                        href={`/transactions/${t.id}/edit`}
                        className="flex min-w-0 flex-1 flex-col gap-0.5"
                      >
                        <span className="truncate text-sm font-medium">
                          {t.categoryName ?? "Uncategorised"}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <Badge variant="secondary" className="text-[10px]">
                            {PAYMENT_MODE_LABELS[t.paymentMode]}
                          </Badge>
                          {t.note && <span className="truncate">{t.note}</span>}
                        </span>
                      </Link>
                      <span
                        className={`shrink-0 font-semibold ${
                          t.type === "income" ? "text-emerald-600" : "text-destructive"
                        }`}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {formatINR(t.amountMinor)}
                      </span>
                      <DeleteButton id={t.id} label={t.categoryName ?? "transaction"} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}

          {transactions.length === PAGE_SIZE && (
            <div className="flex justify-center">
              <Link
                href={{
                  pathname: "/transactions",
                  query: { ...sp, page: String(page + 1) },
                }}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Load more
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
