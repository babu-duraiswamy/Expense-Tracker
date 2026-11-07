import { TIMEZONE } from "./constants";

export function yesterdayOf(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
}

const isoFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE });

/** Today's date in IST as "YYYY-MM-DD" (rule 2: occurredOn is a date string, not a timestamp). */
export function todayIST(now: Date = new Date()): string {
  return isoFormatter.format(now);
}
