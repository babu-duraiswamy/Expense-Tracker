"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Period } from "@/lib/periods";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PRESETS = [
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_quarter_fy", label: "This quarter" },
  { key: "this_fy", label: "This FY" },
  { key: "this_year", label: "This year" },
] as const;

export function PeriodPicker({ activePreset, period }: { activePreset: string; period: Period }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setPreset(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", key);
    params.delete("from");
    params.delete("to");
    router.push(`/reports?${params.toString()}`);
  }

  function setCustomRange(from: string, to: string) {
    if (!from || !to) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("preset", "custom");
    params.set("from", from);
    params.set("to", to);
    router.push(`/reports?${params.toString()}`);
  }

  return (
    <div className="bg-background flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <Badge
            key={p.key}
            variant={activePreset === p.key ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="custom-from">Custom from</Label>
          <Input
            id="custom-from"
            type="date"
            defaultValue={activePreset === "custom" ? period.start : ""}
            className="w-40"
            onChange={(e) =>
              setCustomRange(
                e.target.value,
                (document.getElementById("custom-to") as HTMLInputElement | null)?.value ?? "",
              )
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="custom-to">Custom to</Label>
          <Input
            id="custom-to"
            type="date"
            defaultValue={activePreset === "custom" ? period.end : ""}
            className="w-40"
            onChange={(e) =>
              setCustomRange(
                (document.getElementById("custom-from") as HTMLInputElement | null)?.value ?? "",
                e.target.value,
              )
            }
          />
        </div>
        <p className="text-muted-foreground text-sm">
          Showing: <span className="text-foreground font-medium">{period.label}</span>
        </p>
      </div>
    </div>
  );
}
