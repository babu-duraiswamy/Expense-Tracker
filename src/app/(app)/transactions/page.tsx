import Link from "next/link";
import { ChevronRightIcon, PlusIcon, ReceiptIcon } from "lucide-react";
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
import { listActiveCategories } from "@/lib/categories/queries";
import { VoiceEntry } from "@/components/voice/voice-entry";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";

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

function dateHeading(isoDate: string, todayISO: string): string {
  if (isoDate === todayISO) return "Today";
  const [y, m, d] = todayISO.split("-").map(Number) as [number, number, number];
  const yesterday = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
  if (isoDate === yesterday) return "Yesterday";
  const [iy, im, id] = isoDate.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(iy, im - 1, id)));
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

  const [transactions, totals, categories, expenseCats, incomeCats] = await Promise.all([
    listTransactions(userId, filters, { limit: PAGE_SIZE, offset }),
    getTransactionTotals(userId, filters),
    listCategoriesForFilter(userId),
    listActiveCategories(userId, "expense"),
    listActiveCategories(userId, "income"),
  ]);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const grouped = groupByDate(transactions);
  const hasAnyFilter = Object.entries(sp).some(([k, v]) => k !== "page" && Boolean(v));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1 text-sm">Newest first</p>
        </div>
        <div className="flex items-center gap-2">
          <VoiceEntry expenseCategories={expenseCats} incomeCategories={incomeCats} today={today} />
          <Link
            href="/transactions/new"
            className={cn(buttonVariants(), "hidden gap-1.5 rounded-xl sm:inline-flex")}
          >
            <PlusIcon className="size-4" />
            Add
          </Link>
        </div>
      </div>

      <TransactionFilters categories={categories} />

      <div className="text-sm">
        <span className="text-muted-foreground">Income </span>
        <span className="font-semibold text-emerald-600 tabular-nums">
          {formatINR(totals.incomeMinor)}
        </span>
        <span className="text-muted-foreground mx-3">·</span>
        <span className="text-muted-foreground">Expense </span>
        <span className="font-semibold text-rose-600 tabular-nums">
          {formatINR(totals.expenseMinor)}
        </span>
        <span className="text-muted-foreground mx-3">·</span>
        <span className="text-muted-foreground">Net </span>
        <span className="font-semibold tabular-nums">{formatINR(totals.netMinor)}</span>
      </div>

      {grouped.length === 0 ? (
        <div className="bg-card ring-foreground/5 flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center shadow-sm ring-1">
          <span className="bg-muted flex size-12 items-center justify-center rounded-full">
            <ReceiptIcon className="text-muted-foreground size-5" />
          </span>
          <p className="font-medium">
            {hasAnyFilter ? "Nothing matches these filters" : "No transactions yet"}
          </p>
          <p className="text-muted-foreground text-sm">
            {hasAnyFilter ? "Try clearing a filter." : "Add your first one to start tracking."}
          </p>
          {!hasAnyFilter && (
            <Link href="/transactions/new" className={cn(buttonVariants(), "mt-1 rounded-xl")}>
              <PlusIcon className="size-4" />
              Add transaction
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(([date, items]) => (
            <section key={date} className="flex flex-col gap-1.5">
              <h2 className="text-muted-foreground px-1 text-xs font-semibold tracking-wide uppercase">
                {dateHeading(date, today)}
              </h2>
              <div className="bg-card ring-foreground/5 divide-border divide-y overflow-hidden rounded-2xl shadow-sm ring-1">
                {items.map((t) => {
                  const isIncome = t.type === "income";
                  return (
                    <Link
                      key={t.id}
                      href={`/transactions/${t.id}/edit`}
                      className="hover:bg-muted/50 active:bg-muted flex items-center gap-3 px-4 py-3.5 transition-colors"
                    >
                      <CategoryIcon name={t.categoryName} kind={t.type} />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">
                          {t.categoryName ?? "Uncategorised"}
                        </span>
                        <span className="text-muted-foreground truncate text-xs">
                          {PAYMENT_MODE_LABELS[t.paymentMode]}
                          {t.note ? ` · ${t.note}` : ""}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          isIncome ? "text-emerald-600" : "text-foreground",
                        )}
                      >
                        {isIncome ? "+" : "−"}
                        {formatINR(t.amountMinor)}
                      </span>
                      <ChevronRightIcon
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          {transactions.length === PAGE_SIZE && (
            <div className="flex justify-center">
              <Link
                href={{ pathname: "/transactions", query: { ...sp, page: String(page + 1) } }}
                className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
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
