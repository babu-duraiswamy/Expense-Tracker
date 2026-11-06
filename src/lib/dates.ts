import { TIMEZONE } from "./constants";

const isoFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE });

/** Today's date in IST as "YYYY-MM-DD" (rule 2: occurredOn is a date string, not a timestamp). */
export function todayIST(now: Date = new Date()): string {
  return isoFormatter.format(now);
}
