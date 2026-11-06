"use client";

import { PlayIcon } from "lucide-react";
import type { Budget } from "@/db/schema";
import { formatINR } from "@/lib/money";
import { setBudgetActiveAction } from "@/app/(app)/budgets/actions";
import { Button } from "@/components/ui/button";

export function PausedBudgetRow({ budget }: { budget: Budget }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm">
        {budget.name} — {formatINR(budget.amountMinor)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setBudgetActiveAction(budget.id, true)}
      >
        <PlayIcon />
        Resume
      </Button>
    </div>
  );
}
