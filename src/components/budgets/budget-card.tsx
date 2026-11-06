"use client";

import Link from "next/link";
import { PauseIcon, PencilIcon } from "lucide-react";
import type { BudgetProgress } from "@/lib/budgets/queries";
import { formatINR } from "@/lib/money";
import { setBudgetActiveAction } from "@/app/(app)/budgets/actions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_STYLES = {
  ok: { bar: "bg-primary", badge: null },
  warning: { bar: "bg-amber-500", badge: { label: "Near limit", variant: "secondary" as const } },
  over: { bar: "bg-destructive", badge: { label: "Over budget", variant: "destructive" as const } },
};

export function BudgetCard({ budget }: { budget: BudgetProgress }) {
  const style = STATUS_STYLES[budget.status];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{budget.name}</span>
          <div className="flex items-center gap-2">
            {style.badge && <Badge variant={style.badge.variant}>{style.badge.label}</Badge>}
            <Link
              href={`/budgets/${budget.id}/edit`}
              aria-label={`Edit ${budget.name}`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
            >
              <PencilIcon />
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Pause budget"
              onClick={() => setBudgetActiveAction(budget.id, false)}
            >
              <PauseIcon />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="bg-muted h-2 overflow-hidden rounded-full">
          <div
            className={`h-full ${style.bar}`}
            style={{ width: `${Math.min(100, budget.pctUsed)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span>
            {formatINR(budget.spentMinor)} of {formatINR(budget.amountMinor)}
          </span>
          <span className="text-muted-foreground">{budget.pctUsed.toFixed(0)}% used</span>
        </div>
        <div className="text-muted-foreground flex justify-between text-xs">
          <span>
            {budget.remainingMinor >= 0
              ? `${formatINR(budget.remainingMinor)} left`
              : `${formatINR(-budget.remainingMinor)} over`}
          </span>
          <span>{budget.daysLeft} day(s) left</span>
        </div>
      </CardContent>
    </Card>
  );
}
