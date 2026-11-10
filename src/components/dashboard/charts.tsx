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
import { formatINR } from "@/lib/money";

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

export function CategoryDonut({ data }: { data: { name: string; totalMinor: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.totalMinor, 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
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
            <li key={d.name} className="flex items-center justify-between gap-3">
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
