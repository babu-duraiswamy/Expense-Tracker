/**
 * Period engine (F-RPT-01). All dates are "YYYY-MM-DD" IST calendar dates
 * (rule 2) — arithmetic below is pure calendar math (via Date.UTC as a
 * calculator, never read back as wall-clock time), so it carries no
 * timezone risk despite using the Date object internally.
 */
import { todayIST } from "./dates";

export type PeriodType =
  | "month"
  | "quarter_calendar"
  | "quarter_fy"
  | "financial_year"
  | "calendar_year"
  | "week"
  | "custom";

export interface Period {
  type: PeriodType;
  start: string;
  end: string;
  label: string;
}

type Quarter = 1 | 2 | 3 | 4;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Splits a "YYYY-MM-DD" (or "YYYY-MM") string into numeric parts. We control the format everywhere it's called. */
function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-");
  return [Number(y), Number(m), Number(d ?? 1)];
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

function daysBetweenInclusive(start: string, end: string): number {
  return Math.round((toUTCDate(end).getTime() - toUTCDate(start).getTime()) / 86_400_000) + 1;
}

export function periodLengthDays(period: Period): number {
  return daysBetweenInclusive(period.start, period.end);
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatShort(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUTCDate(iso));
}

/** Which financial year (Apr–Mar) a date falls in, identified by its start year. */
export function fyStartYearFor(dateISO: string): number {
  const [y, m] = parts(dateISO);
  return m >= 4 ? y : y - 1;
}

export function monthPeriod(year: number, month: number): Period {
  const normalized = new Date(Date.UTC(year, month - 1, 1));
  const y = normalized.getUTCFullYear();
  const m = normalized.getUTCMonth() + 1;
  const start = `${y}-${pad(m)}-01`;
  const end = `${y}-${pad(m)}-${pad(lastDayOfMonth(y, m))}`;
  const label = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(normalized);
  return { type: "month", start, end, label };
}

export function quarterCalendarPeriod(year: number, quarter: Quarter): Period {
  const startMonth = (quarter - 1) * 3 + 1;
  const start = monthPeriod(year, startMonth);
  const end = monthPeriod(year, startMonth + 2);
  return {
    type: "quarter_calendar",
    start: start.start,
    end: end.end,
    label: `Q${quarter} ${year}`,
  };
}

export function quarterFYPeriod(fyStartYear: number, quarter: Quarter): Period {
  const absoluteStartMonth = 4 + (quarter - 1) * 3; // 4, 7, 10, 13
  const startYear = fyStartYear + Math.floor((absoluteStartMonth - 1) / 12);
  const startMonth = ((absoluteStartMonth - 1) % 12) + 1;
  const start = monthPeriod(startYear, startMonth);

  const absoluteEndMonth = absoluteStartMonth + 2;
  const endYear = fyStartYear + Math.floor((absoluteEndMonth - 1) / 12);
  const endMonth = ((absoluteEndMonth - 1) % 12) + 1;
  const end = monthPeriod(endYear, endMonth);

  const fyLabel = `FY${String(fyStartYear).slice(-2)}-${String(fyStartYear + 1).slice(-2)}`;
  return { type: "quarter_fy", start: start.start, end: end.end, label: `Q${quarter} ${fyLabel}` };
}

export function financialYearPeriod(fyStartYear: number): Period {
  const start = `${fyStartYear}-04-01`;
  const end = `${fyStartYear + 1}-03-31`;
  const label = `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}`;
  return { type: "financial_year", start, end, label };
}

export function calendarYearPeriod(year: number): Period {
  return {
    type: "calendar_year",
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: String(year),
  };
}

/** Monday–Sunday week containing `dateISO`. */
export function weekPeriod(dateISO: string): Period {
  const d = toUTCDate(dateISO);
  const dow = d.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const start = addDays(dateISO, diffToMonday);
  const end = addDays(start, 6);
  return { type: "week", start, end, label: `${formatShort(start)} – ${formatShort(end)}` };
}

export function customPeriod(start: string, end: string): Period {
  return { type: "custom", start, end, label: `${formatShort(start)} – ${formatShort(end)}` };
}

/** The prior period of the same length, directly before `period.start`. */
export function previousPeriod(period: Period): Period {
  switch (period.type) {
    case "month": {
      const [y, m] = parts(period.start);
      return monthPeriod(y, m - 1);
    }
    case "quarter_calendar": {
      const [y, m] = parts(period.start);
      const prevStart = new Date(Date.UTC(y, m - 1 - 3, 1));
      const quarter = (Math.floor(prevStart.getUTCMonth() / 3) + 1) as Quarter;
      return quarterCalendarPeriod(prevStart.getUTCFullYear(), quarter);
    }
    case "quarter_fy": {
      const [y, m] = parts(period.start);
      const prevStart = new Date(Date.UTC(y, m - 1 - 3, 1));
      const prevStartISO = fromUTCDate(prevStart);
      const fyStart = fyStartYearFor(prevStartISO);
      const monthsFromFYStart = (prevStart.getUTCMonth() - 3 + 12) % 12; // 0, 3, 6, 9
      const quarter = (monthsFromFYStart / 3 + 1) as Quarter;
      return quarterFYPeriod(fyStart, quarter);
    }
    case "financial_year": {
      const fyStart = Number(period.start.slice(0, 4));
      return financialYearPeriod(fyStart - 1);
    }
    case "calendar_year": {
      const y = Number(period.start.slice(0, 4));
      return calendarYearPeriod(y - 1);
    }
    case "week": {
      return weekPeriod(addDays(period.start, -7));
    }
    case "custom": {
      const length = daysBetweenInclusive(period.start, period.end);
      const newEnd = addDays(period.start, -1);
      const newStart = addDays(newEnd, -(length - 1));
      return customPeriod(newStart, newEnd);
    }
  }
}

// ---------- Quick options ----------

export function thisMonth(today: string = todayIST()): Period {
  const [y, m] = parts(today);
  return monthPeriod(y, m);
}

export function lastMonth(today: string = todayIST()): Period {
  return previousPeriod(thisMonth(today));
}

export function thisQuarterFY(today: string = todayIST()): Period {
  const fyStart = fyStartYearFor(today);
  const [, m] = parts(today);
  const quarter = (Math.floor(((m - 4 + 12) % 12) / 3) + 1) as Quarter;
  return quarterFYPeriod(fyStart, quarter);
}

export function thisFinancialYear(today: string = todayIST()): Period {
  return financialYearPeriod(fyStartYearFor(today));
}

export function thisCalendarYear(today: string = todayIST()): Period {
  const [y] = parts(today);
  return calendarYearPeriod(y);
}

/** "YYYY-MM" for every month between start and end, inclusive — so trend charts can show zero, not a gap. */
export function enumerateMonths(start: string, end: string): string[] {
  const months: string[] = [];
  let [y, m] = parts(start);
  const [endY, endM] = parts(end);
  while (y < endY || (y === endY && m <= endM)) {
    months.push(`${y}-${pad(m)}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

export function allTimePeriod(earliest: string, today: string = todayIST()): Period {
  const period = customPeriod(earliest, today);
  return { ...period, label: `All time (${formatShort(earliest)} – ${formatShort(today)})` };
}
