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

const PAYMENT_PHRASE =
  /\b(upi|gpay|phonepe|paytm|net ?banking|bank transfer|neft|imps|debit card|debit|credit card|credit|wallet|cheque|check|cash)\b/gi;
const FILLER_WORDS =
  /\b(add|log|record|save|expense|expenses|income|spent|paid|received|salary|credited|earned|got|rupees|rupee|rs|the|a|an)\b/gi;

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
  sip: "Mutual Funds",
  "mutual fund": "Mutual Funds",
  emi: "Home loan",
};

const GENERIC_WORDS = new Set(["other", "eating", "with", "from", "that", "this"]);

function numberValue(token: string): number | null {
  const cleaned = token.replace(/,/g, "");
  if (/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number(cleaned);
  if (token in UNITS) return UNITS[token]!;
  return null;
}

function tokenize(text: string): string[] {
  return text
    .replace(/[₹?!.]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Reads the amount from the start of a token list and reports which tokens it used. */
function scanAmount(tokens: string[]): { amount: number | null; used: Set<number> } {
  const used = new Set<number>();
  let total = 0;
  let current = 0;
  let started = false;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!.toLowerCase();
    if (token === "and" && started) {
      used.add(i);
    } else if (token === "hundred" && started) {
      current = (current || 1) * 100;
      used.add(i);
    } else if (SCALES[token] && started) {
      total += (current || 1) * SCALES[token]!;
      current = 0;
      used.add(i);
    } else if (numberValue(token) !== null) {
      started = true;
      current += numberValue(token)!;
      used.add(i);
    } else if (started) {
      break;
    }
  }
  const amount = total + current;
  return { amount: started && amount > 0 ? amount : null, used };
}

/** Turns "seven hundred", "2 thousand five hundred" or "1,200" into rupees. Stops at the first non-number after the amount starts. */
export function parseSpokenAmount(text: string): number | null {
  return scanAmount(tokenize(text)).amount;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type CategoryMatch = { category: VoiceCategory; index: number; length: number; exact: boolean };

/** Finds the category named in the text and where in the text it was said. */
export function findCategoryMatch(
  text: string,
  categories: VoiceCategory[],
  kind: "expense" | "income",
): CategoryMatch | null {
  const pool = categories.filter((c) => c.kind === kind);
  const ordered = [...pool].sort((a, b) => b.name.length - a.name.length);

  const locate = (pattern: string): { index: number; length: number } | null => {
    const m = text.match(new RegExp(`(^|[^a-z])(${pattern})(?![a-z])`, "i"));
    return m && m.index !== undefined
      ? { index: m.index + m[1]!.length, length: m[2]!.length }
      : null;
  };

  for (const c of ordered) {
    const hit = locate(escapeRegex(c.name));
    if (hit) return { category: c, exact: true, ...hit };
  }
  for (const [word, target] of Object.entries(SYNONYMS)) {
    const hit = locate(escapeRegex(word));
    const match = hit && pool.find((c) => c.name === target);
    if (hit && match) return { category: match, exact: false, ...hit };
  }
  for (const c of ordered) {
    const distinctive = c.name
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length >= 4 && !GENERIC_WORDS.has(w));
    for (const word of distinctive) {
      const hit = locate(word);
      if (hit) return { category: c, exact: false, ...hit };
    }
  }
  return null;
}

export function findCategory(
  lower: string,
  categories: VoiceCategory[],
  kind: "expense" | "income",
): VoiceCategory | null {
  return findCategoryMatch(lower, categories, kind)?.category ?? null;
}

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
  "i",
);
const MONTH_THEN_DAY = new RegExp(`\\b(${MONTH_PATTERN})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, "i");

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Pulls a spoken date ("today", "yesterday", "5 november", "november 5th") out of the text. Keeps the rest's wording. */
export function extractDate(text: string, today: string): { date: string | null; rest: string } {
  const year = Number(today.slice(0, 4));

  const dayFirst = text.match(DAY_THEN_MONTH);
  if (dayFirst) {
    return {
      date: isoDate(year, MONTH_NAMES[dayFirst[2]!.toLowerCase()]!, Number(dayFirst[1])),
      rest: text.replace(dayFirst[0], " "),
    };
  }
  const monthFirst = text.match(MONTH_THEN_DAY);
  if (monthFirst) {
    return {
      date: isoDate(year, MONTH_NAMES[monthFirst[1]!.toLowerCase()]!, Number(monthFirst[2])),
      rest: text.replace(monthFirst[0], " "),
    };
  }
  if (/\byesterday\b/i.test(text)) {
    return { date: yesterdayOf(today), rest: text.replace(/\byesterday\b/i, " ") };
  }
  if (/\btoday\b/i.test(text)) return { date: today, rest: text.replace(/\btoday\b/i, " ") };
  return { date: null, rest: text };
}

/** Whatever is left after the amount and category, with payment and filler words removed. */
function cleanComment(text: string): string {
  return text
    .replace(PAYMENT_PHRASE, " ")
    .replace(FILLER_WORDS, " ")
    .replace(/[,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseVoiceEntry(
  input: string,
  options: { categories: VoiceCategory[]; today: string },
): { ok: true; entry: VoiceEntry } | { ok: false; reason: string } {
  const { body, note: keywordNote } = splitNote(normalizeTranscript(input));
  const { date, rest } = extractDate(body, options.today);

  const tokens = tokenize(rest);
  const { amount, used } = scanAmount(tokens);
  if (amount === null) {
    return {
      ok: false,
      reason: 'I did not catch an amount. Try saying something like "700 entertainment".',
    };
  }

  const lower = body.toLowerCase();
  const type = /\b(income|received|salary|credited|earned|got paid)\b/.test(lower)
    ? "income"
    : "expense";

  let remaining = tokens.filter((_, i) => !used.has(i)).join(" ");
  const match = findCategoryMatch(remaining, options.categories, type);
  if (match) {
    remaining = remaining.slice(0, match.index) + " " + remaining.slice(match.index + match.length);
  }
  let comment = cleanComment(remaining);
  if (match && !match.exact) comment = comment.replace(/^for\s+/i, "");
  const payment = PAYMENT_WORDS.find(([re]) => re.test(lower))?.[1];

  return {
    ok: true,
    entry: {
      type,
      amountMinor: toPaise(amount.toString()),
      categoryId: match?.category.id ?? null,
      categoryName: match?.category.name ?? null,
      occurredOn: date ?? options.today,
      paymentMode: payment ?? (type === "income" ? "net_banking" : "cash"),
      note: keywordNote ?? (comment || null),
    },
  };
}
