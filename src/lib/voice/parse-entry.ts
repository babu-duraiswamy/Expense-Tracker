import { toPaise } from "@/lib/money";
import { yesterdayOf } from "@/lib/dates";

export type VoiceCategory = { id: string; name: string; kind: "expense" | "income" };

export interface VoiceEntry {
  type: "expense" | "income";
  amountMinor: number;
  categoryId: string | null;
  categoryName: string | null;
  occurredOn: string;
  paymentMode: "cash" | "upi" | "debit_card" | "credit_card" | "net_banking" | "wallet" | "cheque";
  note: string | null;
}

const UNITS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};
const SCALES: Record<string, number> = {
  thousand: 1_000,
  lakh: 100_000,
  lakhs: 100_000,
  crore: 10_000_000,
};

const PAYMENT_WORDS: [RegExp, VoiceEntry["paymentMode"]][] = [
  [/\b(upi|gpay|phonepe|paytm)\b/, "upi"],
  [/\b(net ?banking|bank transfer|neft|imps)\b/, "net_banking"],
  [/\b(debit)\b/, "debit_card"],
  [/\b(credit card|credit)\b/, "credit_card"],
  [/\b(wallet)\b/, "wallet"],
  [/\b(cheque|check)\b/, "cheque"],
  [/\b(cash)\b/, "cash"],
];

const SYNONYMS: Record<string, string> = {
  food: "Food & dining",
  dining: "Food & dining",
  restaurant: "Food & dining",
  "eating out": "Eating Out",
  grocery: "Groceries",
  petrol: "Fuel",
  diesel: "Fuel",
  medicine: "Health",
  medical: "Health",
  doctor: "Health",
  movie: "Entertainment",
  movies: "Entertainment",
  cinema: "Entertainment",
  bus: "Transport",
  taxi: "Transport",
  uber: "Transport",
  auto: "Transport",
  electricity: "Utilities",
  bill: "Utilities",
  shopping: "Shopping",
};

function numberValue(token: string): number | null {
  const cleaned = token.replace(/,/g, "");
  if (/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number(cleaned);
  if (token in UNITS) return UNITS[token]!;
  return null;
}

/** Turns "seven hundred", "2 thousand five hundred" or "1,200" into rupees. Stops at the first non-number after the amount starts. */
export function parseSpokenAmount(text: string): number | null {
  const tokens = text
    .toLowerCase()
    .replace(/[₹?!.]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  let total = 0;
  let current = 0;
  let started = false;
  for (const token of tokens) {
    if (token === "and" && started) continue;
    if (token === "hundred" && started) {
      current = (current || 1) * 100;
      continue;
    }
    if (SCALES[token] && started) {
      total += (current || 1) * SCALES[token]!;
      current = 0;
      continue;
    }
    const value = numberValue(token);
    if (value !== null) {
      started = true;
      current += value;
      continue;
    }
    if (started) break;
  }
  const amount = total + current;
  return started && amount > 0 ? amount : null;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findCategory(
  lower: string,
  categories: VoiceCategory[],
  kind: "expense" | "income",
): VoiceCategory | null {
  const pool = categories.filter((c) => c.kind === kind);
  const ordered = [...pool].sort((a, b) => b.name.length - a.name.length);
  for (const c of ordered) {
    if (new RegExp(`(^|[^a-z])${escapeRegex(c.name.toLowerCase())}($|[^a-z])`).test(lower))
      return c;
  }
  for (const [word, target] of Object.entries(SYNONYMS)) {
    if (new RegExp(`\\b${escapeRegex(word)}\\b`).test(lower)) {
      const match = pool.find((c) => c.name === target);
      if (match) return match;
    }
  }
  for (const c of ordered) {
    const distinctive = c.name
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w));
    if (distinctive.some((w) => new RegExp(`\\b${w}\\b`).test(lower))) return c;
  }
  return null;
}

const GENERIC_WORDS = new Set(["other", "eating", "with", "from", "that", "this"]);

const NOTE_PATTERN = /\b(?:comment|note|remark)s?\b[:,]?\s*(?:saying\s+|that\s+)?/i;

/** Separates a spoken comment ("comment for eggs") from the rest of the phrase. */
export function splitNote(input: string): { body: string; note: string | null } {
  const match = input.match(NOTE_PATTERN);
  if (!match || match.index === undefined) return { body: input, note: null };
  const note = input
    .slice(match.index + match[0].length)
    .replace(/^["'“‘]+|["'”’]+$/g, "")
    .trim();
  return { body: input.slice(0, match.index), note: note || null };
}

/** Speech recognisers often hear "for" as "4" between an amount and a word ("150 4 home"). */
export function normalizeTranscript(input: string): string {
  return input.replace(/(\d[\d,]*)\s+4\s+(?=[a-z])/gi, "$1 for ");
}

const MONTH_NAMES: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};
const MONTH_PATTERN = Object.keys(MONTH_NAMES).join("|");
const DAY_THEN_MONTH = new RegExp(
  `\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_PATTERN})\\b`,
);
const MONTH_THEN_DAY = new RegExp(`\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`);

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Pulls a spoken date ("today", "yesterday", "5 november", "november 5th") out of the text. */
export function extractDate(text: string, today: string): { date: string | null; rest: string } {
  const lower = text.toLowerCase();
  const year = Number(today.slice(0, 4));

  const dayFirst = lower.match(DAY_THEN_MONTH);
  if (dayFirst) {
    return {
      date: isoDate(year, MONTH_NAMES[dayFirst[2]!]!, Number(dayFirst[1])),
      rest: lower.replace(dayFirst[0], " "),
    };
  }
  const monthFirst = lower.match(MONTH_THEN_DAY);
  if (monthFirst) {
    return {
      date: isoDate(year, MONTH_NAMES[monthFirst[1]!]!, Number(monthFirst[2])),
      rest: lower.replace(monthFirst[0], " "),
    };
  }
  if (/\byesterday\b/.test(lower)) {
    return { date: yesterdayOf(today), rest: lower.replace(/\byesterday\b/, " ") };
  }
  if (/\btoday\b/.test(lower)) return { date: today, rest: lower.replace(/\btoday\b/, " ") };
  return { date: null, rest: lower };
}

export function parseVoiceEntry(
  input: string,
  options: { categories: VoiceCategory[]; today: string },
): { ok: true; entry: VoiceEntry } | { ok: false; reason: string } {
  const { body: text, note } = splitNote(normalizeTranscript(input));
  const { date, rest } = extractDate(text, options.today);
  const amount = parseSpokenAmount(rest);
  if (amount === null) {
    return {
      ok: false,
      reason: 'I did not catch an amount. Try saying something like "700 entertainment".',
    };
  }

  const lower = text.toLowerCase();
  const type = /\b(income|received|salary|credited|earned|got paid)\b/.test(lower)
    ? "income"
    : "expense";
  const category = findCategory(lower, options.categories, type);
  const payment = PAYMENT_WORDS.find(([re]) => re.test(lower))?.[1];
  const occurredOn = date ?? options.today;

  return {
    ok: true,
    entry: {
      type,
      amountMinor: toPaise(amount.toString()),
      categoryId: category?.id ?? null,
      categoryName: category?.name ?? null,
      occurredOn,
      paymentMode: payment ?? (type === "income" ? "net_banking" : "cash"),
      note,
    },
  };
}
