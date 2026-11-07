"use client";

import { PlusIcon } from "lucide-react";
import { useActionState, useState } from "react";
import type { Category, Transaction } from "@/db/schema";
import { NEED_OR_WANT_LABELS, PAYMENT_MODES, type PaymentMode } from "@/lib/constants";
import { paiseToInput } from "@/lib/money";
import { createTransactionAction, updateTransactionAction } from "@/app/(app)/transactions/actions";
import { NewCategoryDialog } from "@/components/transactions/new-category-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const PAYMENT_MODE_LABELS: Record<PaymentMode, string> = Object.fromEntries(
  PAYMENT_MODES.map((m) => [m.value, m.label]),
) as Record<PaymentMode, string>;

const NEW_CATEGORY = "__new__";

type TxnType = "expense" | "income";

type Props = {
  expenseCategories: Category[];
  incomeCategories: Category[];
} & (
  | {
      mode: "create";
      today: string;
      defaultPaymentMode: PaymentMode;
      defaultType?: TxnType;
      transaction?: undefined;
    }
  | {
      mode: "edit";
      transaction: Transaction;
      today?: undefined;
      defaultPaymentMode?: undefined;
      defaultType?: undefined;
    }
);

export function TransactionForm(props: Props) {
  const { expenseCategories, incomeCategories, mode, transaction } = props;
  const action = mode === "create" ? createTransactionAction : updateTransactionAction;
  const [error, formAction, pending] = useActionState(action, undefined);
  const [type, setType] = useState<TxnType>(
    transaction?.type === "income"
      ? "income"
      : mode === "create" && props.defaultType === "income"
        ? "income"
        : "expense",
  );
  type CategoryOption = Pick<Category, "id" | "name" | "needOrWant">;
  const [lists, setLists] = useState<Record<TxnType, CategoryOption[]>>({
    expense: expenseCategories,
    income: incomeCategories,
  });
  const [categoryId, setCategoryId] = useState<string | null>(transaction?.categoryId ?? null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const categories = lists[type];

  function switchType(next: TxnType) {
    setType(next);
    setCategoryId(null);
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-5"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.requestSubmit();
        }
      }}
    >
      {mode === "edit" && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="type" value={type} />

      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <ToggleGroup
          value={[type]}
          onValueChange={(v) => {
            if (v[0]) switchType(v[0] as TxnType);
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
          className="h-12 text-lg font-semibold"
          defaultValue={transaction ? paiseToInput(transaction.amountMinor) : undefined}
          autoFocus={mode === "create"}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoryId">Category</Label>
        <Select
          name="categoryId"
          value={categoryId}
          onValueChange={(v) => {
            if (v === NEW_CATEGORY) {
              setDialogOpen(true);
              return;
            }
            setCategoryId(v);
          }}
        >
          <SelectTrigger id="categoryId" className="h-10 w-full">
            <SelectValue>
              {(value: string | null) =>
                value ? categories.find((c) => c.id === value)?.name : "Choose a category"
              }
            </SelectValue>
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
            <SelectSeparator />
            <SelectItem value={NEW_CATEGORY}>
              <span className="text-primary inline-flex items-center gap-1.5 font-medium">
                <PlusIcon className="size-3.5" />
                New category
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
        <NewCategoryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          kind={type}
          onCreated={(created) => {
            setLists((prev) => ({
              ...prev,
              [created.kind]: [...prev[created.kind], created],
            }));
            if (created.kind === type) setCategoryId(created.id);
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="occurredOn">Date</Label>
          <Input
            id="occurredOn"
            name="occurredOn"
            type="date"
            className="h-10"
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
            <SelectTrigger id="paymentMode" className="h-10 w-full">
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

      <Button type="submit" disabled={pending} size="lg" className="h-11 w-full text-base">
        {pending ? "Saving…" : mode === "create" ? "Save transaction" : "Save changes"}
      </Button>
    </form>
  );
}
