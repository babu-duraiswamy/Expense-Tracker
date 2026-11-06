"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/lib/money";

export function TrendChart({
  data,
}: {
  data: { month: string; incomeMinor: number; expenseMinor: number }[];
}) {
  const chartData = data.map((d) => ({
    month: new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(
      new Date(`${d.month}-01T00:00:00`),
    ),
    Income: d.incomeMinor / 100,
    Expense: d.expenseMinor / 100,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            width={56}
            tickFormatter={(v) => formatINR(v * 100, { whole: true })}
          />
          <Tooltip formatter={(value) => formatINR(Number(value) * 100)} />
          <Legend />
          <Bar dataKey="Income" fill="#059669" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expense" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
