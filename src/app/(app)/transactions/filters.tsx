"use client";

import { ChevronDownIcon, SearchIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PAYMENT_MODES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

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

  const activeAdvanced = categoryIds.length + paymentModes.length + (from ? 1 : 0) + (to ? 1 : 0);
  const [open, setOpen] = useState(activeAdvanced > 0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || isTyping(e.target)) return;
      e.preventDefault();
      document.getElementById("transaction-search")?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            id="transaction-search"
            defaultValue={note}
            placeholder="Search notes…  (press /)"
            aria-label="Search notes"
            className="h-10 rounded-xl pl-9"
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            value={[type]}
            onValueChange={(v) => v[0] && navigate({ type: v[0] === "all" ? null : v[0] })}
            variant="outline"
            className="rounded-xl"
          >
            <ToggleGroupItem value="all" className="h-10 rounded-lg px-3">
              All
            </ToggleGroupItem>
            <ToggleGroupItem value="expense" className="h-10 rounded-lg px-3">
              Expense
            </ToggleGroupItem>
            <ToggleGroupItem value="income" className="h-10 rounded-lg px-3">
              Income
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            Filters
            {activeAdvanced > 0 && (
              <span className="bg-primary text-primary-foreground ml-1 rounded-full px-1.5 text-[11px]">
                {activeAdvanced}
              </span>
            )}
            <ChevronDownIcon className={cn("size-4 transition-transform", open && "rotate-180")} />
          </Button>
        </div>
      </div>

      {open && (
        <div className="bg-card ring-foreground/5 flex flex-col gap-4 rounded-2xl p-4 shadow-sm ring-1">
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="from" className="text-xs">
                From
              </Label>
              <Input
                id="from"
                type="date"
                value={from}
                className="h-9"
                onChange={(e) => navigate({ from: e.target.value || null })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="to" className="text-xs">
                To
              </Label>
              <Input
                id="to"
                type="date"
                value={to}
                className="h-9"
                onChange={(e) => navigate({ to: e.target.value || null })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs">Categories</Label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  active={categoryIds.includes(c.id)}
                  onClick={() => toggleListParam("category", categoryIds, c.id)}
                >
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-xs">Payment mode</Label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_MODES.map((m) => (
                <Chip
                  key={m.value}
                  active={paymentModes.includes(m.value)}
                  onClick={() => toggleListParam("mode", paymentModes, m.value)}
                >
                  {m.label}
                </Chip>
              ))}
            </div>
          </div>

          {activeAdvanced > 0 && (
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => navigate({ category: null, mode: null, from: null, to: null })}
              >
                <XIcon className="size-3.5" />
                Clear advanced filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}
