/**
 * Money helpers. All money is integer paise. Never do arithmetic on rupee floats.
 */

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

/**
 * Parse a user-entered rupee amount into paise without floating-point maths.
 * Accepts "249", "249.5", "249.50", "1,23,456.78". Throws on invalid input.
 */
export function toPaise(input: string): number {
  const cleaned = input.trim().replace(/[₹,\s]/g, "");
  if (!AMOUNT_RE.test(cleaned)) {
    throw new Error(`Invalid amount: "${input}"`);
  }
  const [rupees = "0", fraction = ""] = cleaned.split(".");
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise)) {
    throw new Error(`Amount too large: "${input}"`);
  }
  return paise;
}

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 12345600 → "₹1,23,456.00" (Indian digit grouping). Display only. */
export function formatINR(paise: number, opts: { whole?: boolean } = {}): string {
  const formatter = opts.whole ? inrWholeFormatter : inrFormatter;
  return formatter.format(paise / 100);
}

/** 24950 → "249.50" — for pre-filling form inputs. */
export function paiseToInput(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** Sum paise values safely. */
export function sumPaise(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/** Percentage change from `prev` to `curr`; null when prev is 0. */
export function percentChange(prev: number, curr: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}
