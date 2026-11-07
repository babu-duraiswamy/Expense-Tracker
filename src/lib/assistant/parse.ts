import {
  allTimePeriod,
  calendarYearPeriod,
  lastMonth,
  monthPeriod,
  thisMonth,
  type Period,
} from "@/lib/periods";

export type Intent =
  | "totals"
  | "topCategories"
  | "topTransactions"
  | "avoidable"
  | "compare"
  | "income"
  | "savings"
  | "budgets"
  | "categoryTotal"
  | "help";

export interface ParseContext {
  categories: string[];
  earliest: string | null;
}

export interface ParsedQuestion {
  intent: Intent;
  period: Period;
  periodLabelGiven: boolean;
  category: string | null;
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
const ALL_TIME_RE =
  /\b(overall|all time|all months|all these months|all the months|so far|till date|to date|altogether|in total|ever|since i started)\b/;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Finds a category name in the question. Longer names win, so "For Home" beats "Home". */
export function findCategory(q: string, categories: string[]): string | null {
  const ordered = [...categories].sort((a, b) => b.length - a.length);
  for (const name of ordered) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegex(name.toLowerCase())}($|[^a-z0-9])`);
    if (re.test(q)) return name;
  }
  return null;
}

function resolvePeriod(
  q: string,
  today: string,
  earliest: string | null,
): { period: Period; given: boolean } {
  const [todayYear] = today.split("-").map(Number) as [number];
  if (ALL_TIME_RE.test(q)) return { period: allTimePeriod(earliest ?? today, today), given: true };
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

function resolveIntent(q: string, category: string | null): Intent {
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
  if (category) return "categoryTotal";
  if (/\b(most|biggest|largest|highest|top)\b/.test(q)) return "topCategories";
  if (/\bincome|salary|earn|earned|received\b/.test(q)) return "income";
  if (/\bsavings?\b|\bsaving rate\b|\bnet\b|\bsaved\b/.test(q)) return "savings";
  if (/\bbudgets?\b/.test(q)) return "budgets";
  if (/\btotal|how much|spent|spend|expenses?\b/.test(q)) return "totals";
  return "help";
}

export function parseQuestion(question: string, today: string, ctx: ParseContext): ParsedQuestion {
  const q = question.toLowerCase().trim();
  const category = findCategory(q, ctx.categories);
  const intent = resolveIntent(q, category);
  let { period, given } = resolvePeriod(q, today, ctx.earliest);

  // "Avoidable" and per-category questions are more useful across all history
  // when no period is named, so that is the default for them.
  if (!given && (intent === "avoidable" || intent === "categoryTotal")) {
    period = allTimePeriod(ctx.earliest ?? today, today);
    given = true;
  }

  return { intent, period, periodLabelGiven: given, category };
}

export const EXAMPLE_QUESTIONS = [
  "What were my biggest expenses in July?",
  "What could I have avoided?",
  "How much have I spent on For Home overall?",
  "How much did I spend last month?",
  "Compare this month with last month",
  "What are my biggest single transactions this year?",
  "What is my savings rate in March?",
  "How are my budgets doing?",
];
