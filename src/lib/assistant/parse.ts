import { calendarYearPeriod, lastMonth, monthPeriod, thisMonth, type Period } from "@/lib/periods";

export type Intent =
  | "totals"
  | "topCategories"
  | "topTransactions"
  | "avoidable"
  | "compare"
  | "income"
  | "savings"
  | "budgets"
  | "help";

export interface ParsedQuestion {
  intent: Intent;
  period: Period;
  periodLabelGiven: boolean;
}

const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

const MONTH_RE = new RegExp(`\\b(${Object.keys(MONTHS).join("|")})\\b`);

function resolvePeriod(q: string, today: string): { period: Period; given: boolean } {
  const [todayYear] = today.split("-").map(Number) as [number];
  if (/\blast month\b|\bprevious month\b/.test(q)) return { period: lastMonth(today), given: true };
  if (/\bthis month\b|\bcurrent month\b/.test(q)) return { period: thisMonth(today), given: true };

  const yearMatch = q.match(/\b(20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : todayYear;
  const monthMatch = q.match(MONTH_RE);

  if (monthMatch) {
    const m = MONTHS[monthMatch[1]!]!;
    return { period: monthPeriod(year, m), given: true };
  }
  if (/\bthis year\b|\bthe year\b|\byear\b/.test(q) || yearMatch) {
    return { period: calendarYearPeriod(year), given: true };
  }
  return { period: thisMonth(today), given: false };
}

function resolveIntent(q: string): Intent {
  if (
    /\bavoid|avoidable|could have|could've|\bcut\b|\breduce\b|\bwaste|save more|where can i save|cut back|overspend/.test(
      q,
    )
  ) {
    return "avoidable";
  }
  if (/\bcompare|comparison|\bvs\b|versus|against|than last|than previous/.test(q))
    return "compare";
  if (
    /\b(most|biggest|largest|highest|top)\b/.test(q) &&
    /\b(transaction|purchase|single|one|item|bill)s?\b/.test(q)
  ) {
    return "topTransactions";
  }
  if (/\b(most|biggest|largest|highest|top)\b/.test(q)) return "topCategories";
  if (/\bincome|salary|earn|earned|received\b/.test(q)) return "income";
  if (/\bsavings?\b|\bsaving rate\b|\bnet\b|\bsaved\b/.test(q)) return "savings";
  if (/\bbudgets?\b/.test(q)) return "budgets";
  if (/\btotal|how much|spent|spend|expenses?\b/.test(q)) return "totals";
  return "help";
}

export function parseQuestion(question: string, today: string): ParsedQuestion {
  const q = question.toLowerCase().trim();
  const { period, given } = resolvePeriod(q, today);
  return { intent: resolveIntent(q), period, periodLabelGiven: given };
}

export const EXAMPLE_QUESTIONS = [
  "What were my biggest expenses in July?",
  "What could I have avoided in July?",
  "How much did I spend last month?",
  "Compare this month with last month",
  "What are my biggest single transactions this year?",
  "What is my savings rate in March?",
  "How are my budgets doing?",
];
