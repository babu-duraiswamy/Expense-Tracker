"use client";

import { useActionState, useState } from "react";
import type { Category, Transaction } from "@/db/schema";
import { NEED_OR_WANT_LABELS, PAYMENT_MODES, type PaymentMode } from "@/lib/constants";
import { paiseToInput } from "@/lib/money";
import { createTransactionAction, updateTransactionAction } from "@/app/(app)/transactions/actions";
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
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = Object.fromEntries(
  PAYMENT_MODES.map((m) => [m.value, m.label]),
) as Record<PaymentMode, string>;

type Props = {
  expenseCategories: Category[];
  incomeCategories: Category[];
} & (
  | { mode: "create"; today: string; defaultPaymentMode: PaymentMode; transaction?: undefined }
  | { mode: "edit"; transaction: Transaction; today?: undefined; defaultPaymentMode?: undefined }
);

export function TransactionForm(props: Props) {
  const { expenseCategories, incomeCategories, mode, transaction } = props;
  const action = mode === "create" ? createTransactionAction : updateTransactionAction;
  const [error, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState<"expense" | "income">(
    transaction?.type === "income" ? "income" : "expense",
  );
  const categories = type === "expense" ? expenseCategories : incomeCategories;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {mode === "edit" && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="type" value={type} />

      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <ToggleGroup
          value={[type]}
          onValueChange={(v) => {
            if (v[0]) setType(v[0] as "expense" | "income");
          }}
          variant="outline"
          className="w-full"
        >
          <ToggleGroupItem value="expense" className="flex-1">
            Expense
          </ToggleGroupItem>
          <ToggleGroupItem value="income" className="flex-1">
            Income
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">Amount (₹)</Label>
        <Input
          id="amount"
          name="amountMinor"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={transaction ? paiseToInput(transaction.amountMinor) : undefined}
          autoFocus={mode === "create"}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <Select name="categoryId" key={type} defaultValue={transaction?.categoryId ?? undefined}>
          <SelectTrigger id="categoryId" className="w-full">
            <SelectValue placeholder="Choose a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.length === 0 && (
              <div className="text-muted-foreground px-2 py-1.5 text-sm">
                No {type} categories yet.
              </div>
            )}
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {c.needOrWant && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {NEED_OR_WANT_LABELS[c.needOrWant]}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="occurredOn">Date</Label>
          <Input
            id="occurredOn"
            name="occurredOn"
            type="date"
            defaultValue={transaction?.occurredOn ?? props.today}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="paymentMode">Payment mode</Label>
          <Select
            name="paymentMode"
            defaultValue={transaction?.paymentMode ?? props.defaultPaymentMode}
          >
            <SelectTrigger id="paymentMode" className="w-full">
              <SelectValue>{(value: PaymentMode) => PAYMENT_MODE_LABELS[value]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          name="note"
          rows={2}
          maxLength={280}
          defaultValue={transaction?.note ?? ""}
        />
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending} size="lg" className="w-full">
        {pending ? "Saving…" : mode === "create" ? "Save transaction" : "Save changes"}
      </Button>
    </form>
  );
}
