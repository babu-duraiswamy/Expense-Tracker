"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  listCategoryTransactionsAction,
  type CategoryTransaction,
} from "@/app/(app)/transactions/category-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/money";

const dayLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

export const CHART_PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#8b5cf6",
  "#84cc16",
  "#94a3b8",
];

const shortMonth = new Intl.DateTimeFormat("en-IN", { month: "short" });

export function TrendBars({
  data,
}: {
  data: { month: string; incomeMinor: number; expenseMinor: number }[];
}) {
  const chartData = data.map((d) => ({
    month: shortMonth.format(new Date(`${d.month}-01T00:00:00`)),
    Income: d.incomeMinor / 100,
    Expense: d.expenseMinor / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barGap={4} barCategoryGap="22%">
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickFormatter={(v) => formatINR(Number(v) * 100, { whole: true })}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
          formatter={(value) => formatINR(Number(value) * 100)}
        />
        <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
        <Bar dataKey="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export type DonutSlice = {
  name: string;
  totalMinor: number;
  categoryIds: string[];
  /** Set on the grouped "Other" slice: the categories it is made of. */
  children?: { categoryId: string; name: string; totalMinor: number }[];
};

export function CategoryDonut({
  data,
  from,
  to,
}: {
  data: DonutSlice[];
  from: string;
  to: string;
}) {
  const total = data.reduce((sum, d) => sum + d.totalMinor, 0);
  const [selected, setSelected] = useState<{ slice: DonutSlice; color: string } | null>(null);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="totalMinor"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              style={{ cursor: "pointer" }}
              onClick={(_, i) =>
                data[i] &&
                setSelected({ slice: data[i], color: CHART_PALETTE[i % CHART_PALETTE.length]! })
              }
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-muted-foreground text-[11px] tracking-wide uppercase">Spent</span>
          <span className="text-sm font-semibold">{formatINR(total, { whole: true })}</span>
        </div>
      </div>
      <ul className="flex w-full flex-col gap-2 text-sm">
        {data.map((d, i) => {
          const pct = total > 0 ? (d.totalMinor / total) * 100 : 0;
          return (
            <li key={d.name}>
              <button
                type="button"
                onClick={() =>
                  setSelected({ slice: d, color: CHART_PALETTE[i % CHART_PALETTE.length]! })
                }
                className="hover:bg-muted -mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-lg px-2 py-1 text-left"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }}
                  />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                  <span className="font-medium">{formatINR(d.totalMinor, { whole: true })}</span>
                  <span className="text-muted-foreground w-9 text-right text-xs">
                    {pct.toFixed(0)}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <CategoryTransactionsDialog
          key={selected.slice.name}
          slice={selected.slice}
          color={selected.color}
          from={from}
          to={to}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function CategoryTransactionsDialog({
  slice,
  color,
  from,
  to,
  onClose,
}: {
  slice: DonutSlice;
  color: string;
  from: string;
  to: string;
  onClose: () => void;
}) {
  // "Other" first lists its categories; picking one drills into that category alone.
  const [drill, setDrill] = useState<DonutSlice | null>(null);
  const active = drill ?? (slice.children ? null : slice);
  const shown = active ?? slice;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          {drill && (
            <button
              type="button"
              onClick={() => setDrill(null)}
              className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-xs"
            >
              <ChevronLeftIcon className="size-3.5" />
              Back to {slice.name}
            </button>
          )}
          <DialogTitle className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ background: color }} />
            {shown.name}
          </DialogTitle>
          <DialogDescription>{formatINR(shown.totalMinor)} spent this month</DialogDescription>
        </DialogHeader>

        {active ? (
          <TransactionList key={active.name} slice={active} from={from} to={to} />
        ) : (
          <ul className="divide-border -mx-1 flex max-h-[60vh] flex-col divide-y overflow-y-auto">
            {slice.children?.map((c) => (
              <li key={c.categoryId}>
                <button
                  type="button"
                  onClick={() =>
                    setDrill({
                      name: c.name,
                      totalMinor: c.totalMinor,
                      categoryIds: [c.categoryId],
                    })
                  }
                  className="hover:bg-muted flex w-full items-center justify-between gap-3 rounded-lg px-1 py-3 text-left"
                >
                  <span className="truncate text-sm font-medium">{c.name}</span>
                  <span className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
                    {formatINR(c.totalMinor)}
                    <ChevronRightIcon className="text-muted-foreground size-4" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TransactionList({ slice, from, to }: { slice: DonutSlice; from: string; to: string }) {
  const [rows, setRows] = useState<CategoryTransaction[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listCategoryTransactionsAction({ categoryIds: slice.categoryIds, from, to })
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [slice, from, to]);

  if (failed) {
    return (
      <p className="text-destructive py-6 text-center text-sm">Could not load transactions.</p>
    );
  }
  if (rows === null) {
    return <p className="text-muted-foreground py-6 text-center text-sm">Loading…</p>;
  }
  return (
    <>
      <p className="text-muted-foreground -mt-2 text-xs">
        {rows.length} transaction{rows.length === 1 ? "" : "s"}
      </p>
      <ul className="divide-border -mx-1 flex max-h-[60vh] flex-col divide-y overflow-y-auto">
        {rows.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 px-1 py-3">
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {t.note || t.categoryName || "Expense"}
              </span>
              <span className="text-muted-foreground text-xs">
                {dayLabel.format(new Date(`${t.occurredOn}T00:00:00`))}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatINR(t.amountMinor)}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
