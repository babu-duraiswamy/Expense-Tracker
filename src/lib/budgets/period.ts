/**
 * Recurring budget periods (F-BUD-01). A weekly/monthly/quarterly/yearly
 * budget recurs indefinitely from its startDate; a custom budget applies
 * once over its fixed start–end window. All pure calendar-date math.
 */

export type BudgetPeriodType = "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

export interface DateWindow {
  start: string;
  end: string;
}

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-");
  return [Number(y), Number(m), Number(d)];
}

function toUTCDate(iso: string): Date {
  const [y, m, d] = parts(iso);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTCDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  const d = toUTCDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTCDate(d);
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = parts(iso);
  return fromUTCDate(new Date(Date.UTC(y, m - 1 + months, d)));
}

function windowEnd(start: string, periodType: Exclude<BudgetPeriodType, "custom">): string {
  switch (periodType) {
    case "weekly":
      return addDays(start, 6);
    case "monthly":
      return addDays(addMonths(start, 1), -1);
    case "quarterly":
      return addDays(addMonths(start, 3), -1);
    case "yearly":
      return addDays(addMonths(start, 12), -1);
  }
}

/**
 * The budget period window that contains `today`. For a recurring budget,
 * steps forward from `startDate` one window at a time (bounded — windows
 * are at least 7 days, so this terminates quickly for any realistic date).
 */
export function currentBudgetPeriod(
  budget: { periodType: BudgetPeriodType; startDate: string; endDate: string | null },
  today: string,
): DateWindow {
  if (budget.periodType === "custom") {
    return { start: budget.startDate, end: budget.endDate ?? budget.startDate };
  }

  let start = budget.startDate;
  let end = windowEnd(start, budget.periodType);
  while (end < today) {
    start = addDays(end, 1);
    end = windowEnd(start, budget.periodType);
  }
  return { start, end };
}

export function daysLeftInPeriod(window: DateWindow, today: string): number {
  if (today > window.end) return 0;
  const [ty, tm, td] = parts(today);
  const [ey, em, ed] = parts(window.end);
  const todayDate = new Date(Date.UTC(ty, tm - 1, td));
  const endDate = new Date(Date.UTC(ey, em - 1, ed));
  return Math.round((endDate.getTime() - todayDate.getTime()) / 86_400_000) + 1;
}
