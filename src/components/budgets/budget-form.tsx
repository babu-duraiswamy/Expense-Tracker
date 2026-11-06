"use client";

import { useActionState, useState } from "react";
import type { Budget, Category } from "@/db/schema";
import { todayIST } from "@/lib/dates";
import { createBudgetAction, updateBudgetAction } from "@/app/(app)/budgets/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERIOD_LABELS = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
  custom: "Custom (one-off)",
} as const;

type Props = {
  expenseCategories: Category[];
  budget?: Budget & { categoryIds: string[] };
};

export function BudgetForm({ expenseCategories, budget }: Props) {
  const action = budget ? updateBudgetAction : createBudgetAction;
  const [error, formAction, pending] = useActionState(action, undefined);
  const [scope, setScope] = useState<"total" | "categories">(budget?.scope ?? "total");
  const [periodType, setPeriodType] = useState<keyof typeof PERIOD_LABELS>(
    (budget?.periodType as keyof typeof PERIOD_LABELS) ?? "monthly",
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {budget && <input type="hidden" name="id" value={budget.id} />}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={budget?.name}
          placeholder="e.g. Food budget"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          name="amountMinor"
          inputMode="decimal"
          defaultValue={budget ? (budget.amountMinor / 100).toFixed(2) : undefined}
          placeholder="0.00"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Scope</Label>
        <input type="hidden" name="scope" value={scope} />
        <div className="flex gap-2">
          <Button
            type="button"
            variant={scope === "total" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("total")}
          >
            Total spend
          </Button>
          <Button
            type="button"
            variant={scope === "categories" ? "default" : "outline"}
            size="sm"
            onClick={() => setScope("categories")}
          >
            Specific categories
          </Button>
        </div>
      </div>

      {scope === "categories" && (
        <div className="flex flex-col gap-1.5">
          <Label>Categories</Label>
          <div className="flex flex-wrap gap-3 rounded-lg border p-3">
            {expenseCategories.map((c) => (
              <label key={c.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={c.id}
                  defaultChecked={budget?.categoryIds.includes(c.id)}
                  className="size-4"
                />
                {c.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="periodType">Period</Label>
        <Select
          name="periodType"
          value={periodType}
          onValueChange={(v) => setPeriodType(v as keyof typeof PERIOD_LABELS)}
        >
          <SelectTrigger id="periodType" className="w-full">
            <SelectValue>{(value: keyof typeof PERIOD_LABELS) => PERIOD_LABELS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Start date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={budget?.startDate ?? todayIST()}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">End date {periodType === "custom" ? "" : "(optional)"}</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={budget?.endDate ?? undefined}
            required={periodType === "custom"}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Saving…" : budget ? "Save changes" : "Create budget"}
      </Button>
    </form>
  );
}
