import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRightIcon, ArrowUpRightIcon, ChevronRightIcon, MinusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "income" | "expense" | "neutral" | "accent";

const TONE_CLASSES: Record<Tone, { icon: string; value: string; card: string }> = {
  income: {
    icon: "bg-emerald-500/15 text-emerald-600",
    value: "text-emerald-600",
    card: "from-emerald-50 dark:from-emerald-500/10",
  },
  expense: {
    icon: "bg-rose-500/15 text-rose-600",
    value: "text-rose-600",
    card: "from-rose-50 dark:from-rose-500/10",
  },
  neutral: {
    icon: "bg-sky-500/15 text-sky-600",
    value: "text-foreground",
    card: "from-sky-50 dark:from-sky-500/10",
  },
  accent: {
    icon: "bg-indigo-500/15 text-indigo-600",
    value: "text-foreground",
    card: "from-indigo-50 dark:from-indigo-500/10",
  },
};

/**
 * `delta` is the change vs the previous period as a percentage. `higherIsBad`
 * flips the colour so that, for example, rising expenses read as a warning.
 * `href` makes the card open the underlying transactions.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  delta,
  higherIsBad = false,
  footnote,
  href,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  delta?: number | null;
  higherIsBad?: boolean;
  footnote?: string;
  href?: string;
}) {
  const showDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const isUp = showDelta && delta > 0.5;
  const isDown = showDelta && delta < -0.5;
  const good = isUp ? !higherIsBad : isDown ? higherIsBad : null;

  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        <span
          className={cn(
            "flex size-9 items-center justify-center rounded-xl",
            TONE_CLASSES[tone].icon,
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <span
        className={cn(
          "text-2xl font-semibold tracking-tight tabular-nums",
          TONE_CLASSES[tone].value,
        )}
      >
        {value}
      </span>
      <div className="flex items-center gap-1.5 text-xs">
        {showDelta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              good === null
                ? "bg-muted text-muted-foreground"
                : good
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-600",
            )}
          >
            {isUp ? (
              <ArrowUpRightIcon className="size-3" />
            ) : isDown ? (
              <ArrowDownRightIcon className="size-3" />
            ) : (
              <MinusIcon className="size-3" />
            )}
            {Math.abs(delta).toFixed(0)}%
          </span>
        ) : null}
        {footnote && <span className="text-muted-foreground truncate">{footnote}</span>}
        {href && (
          <ChevronRightIcon className="text-muted-foreground ml-auto size-4 shrink-0" aria-hidden />
        )}
      </div>
    </>
  );

  const className = cn(
    "to-card bg-gradient-to-br ring-foreground/5 flex flex-col gap-3 rounded-2xl p-5 shadow-sm ring-1",
    TONE_CLASSES[tone].card,
  );
  if (!href) return <div className={className}>{body}</div>;
  return (
    <Link
      href={href}
      aria-label={`${label}: ${value}`}
      className={cn(className, "hover:ring-foreground/15 transition-shadow hover:shadow-md")}
    >
      {body}
    </Link>
  );
}
