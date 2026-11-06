"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";
import { PAYMENT_MODES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type CategoryOption = { id: string; name: string; kind: "expense" | "income" };

export function TransactionFilters({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const type = searchParams.get("type") ?? "all";
  const categoryIds = searchParams.get("category")?.split(",").filter(Boolean) ?? [];
  const paymentModes = searchParams.get("mode")?.split(",").filter(Boolean) ?? [];
  const note = searchParams.get("q") ?? "";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function navigate(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`/transactions?${params.toString()}`);
  }

  function toggleListParam(key: string, current: string[], value: string) {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    navigate({ [key]: next.join(",") || null });
  }

  function onSearchChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ q: value || null }), 350);
  }

  return (
    <div className="bg-background flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <ToggleGroup
            value={[type]}
            onValueChange={(v) => v[0] && navigate({ type: v[0] === "all" ? null : v[0] })}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="expense">Expense</ToggleGroupItem>
            <ToggleGroupItem value="income">Income</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            defaultValue={from}
            className="w-36"
            onChange={(e) => navigate({ from: e.target.value || null })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            defaultValue={to}
            className="w-36"
            onChange={(e) => navigate({ to: e.target.value || null })}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="q">Search note</Label>
          <Input
            id="q"
            defaultValue={note}
            placeholder="e.g. Swiggy"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={categoryIds.includes(c.id) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => toggleListParam("category", categoryIds, c.id)}
            >
              {c.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Payment mode</Label>
        <div className="flex flex-wrap gap-1.5">
          {PAYMENT_MODES.map((m) => (
            <Badge
              key={m.value}
              variant={paymentModes.includes(m.value) ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => toggleListParam("mode", paymentModes, m.value)}
            >
              {m.label}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
