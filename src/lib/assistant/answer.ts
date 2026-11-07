import { formatINR, percentChange } from "@/lib/money";
import { EXAMPLE_QUESTIONS, type Intent } from "./parse";

export interface CategoryDetail {
  name: string;
  totalMinor: number;
  monthly: { month: string; totalMinor: number }[];
}

export interface AssistantData {
  category?: CategoryDetail | null;
  label: string;
  previousLabel: string;
  periodGiven: boolean;
  summary: {
    incomeMinor: number;
    expenseMinor: number;
    netMinor: number;
    savingsRate: number | null;
  };
  previousSummary: {
    incomeMinor: number;
    expenseMinor: number;
    netMinor: number;
    savingsRate: number | null;
  };
  expenseByCategory: {
    categoryName: string;
    needOrWant: "need" | "want" | null;
    totalMinor: number;
  }[];
  previousExpenseByCategory: { categoryName: string; totalMinor: number }[];
  incomeBySource: { categoryName: string; totalMinor: number }[];
  topTransactions: {
    categoryName: string;
    occurredOn: string;
    amountMinor: number;
    note: string | null;
  }[];
  smallLeaks: { categoryName: string; count: number; totalMinor: number }[];
  budgets: {
    name: string;
    status: "ok" | "warning" | "over";
    pctUsed: number;
    spentMinor: number;
    amountMinor: number;
  }[];
}

const WANT_CUT_SHARE = 0.3;

const pct = (n: number) => `${n.toFixed(0)}%`;

function notePeriod(data: AssistantData): string {
  return data.periodGiven ? "" : ` (showing ${data.label}, the default period)`;
}

function answerTotals(d: AssistantData): string {
  const { summary: s, label } = d;
  if (s.expenseMinor === 0 && s.incomeMinor === 0) return `Nothing has been recorded for ${label}.`;
  const top = d.expenseByCategory
    .slice(0, 3)
    .map((c) => c.categoryName)
    .join(", ");
  const parts = [
    `In ${label} you spent ${formatINR(s.expenseMinor)} and received ${formatINR(s.incomeMinor)}, a net of ${formatINR(s.netMinor)}.`,
  ];
  if (top) parts.push(`Your biggest categories were ${top}.`);
  return parts.join(" ") + notePeriod(d);
}

function answerTopCategories(d: AssistantData): string {
  const rows = d.expenseByCategory.slice(0, 5);
  if (rows.length === 0) return `No expenses recorded for ${d.label}.`;
  const total = d.summary.expenseMinor;
  const lines = rows.map(
    (r, i) =>
      `${i + 1}. ${r.categoryName}: ${formatINR(r.totalMinor)} (${pct((r.totalMinor / total) * 100)})`,
  );
  return [`Your biggest expenses in ${d.label}:`, ...lines].join("\n") + notePeriod(d);
}

const IMPORT_NOTE = "Imported monthly total";

function describeNote(note: string | null): string {
  if (!note) return "";
  if (note.startsWith(IMPORT_NOTE)) return " (monthly total from your phone app)";
  return ` (${note})`;
}

function answerTopTransactions(d: AssistantData): string {
  const rows = d.topTransactions.slice(0, 5);
  if (rows.length === 0) return `No expenses recorded for ${d.label}.`;
  const lines = rows.map((t, i) => {
    const date = new Date(`${t.occurredOn}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    const note = describeNote(t.note);
    return `${i + 1}. ${formatINR(t.amountMinor)}: ${t.categoryName}, ${date}${note}`;
  });
  const hasImported = rows.some((t) => t.note?.startsWith(IMPORT_NOTE));
  const footer = hasImported
    ? ["", "Imported entries are monthly totals per category, not single purchases."]
    : [];
  return (
    [`Your largest single expenses in ${d.label}:`, ...lines, ...footer].join("\n") + notePeriod(d)
  );
}

function answerAvoidable(d: AssistantData): string {
  if (d.summary.expenseMinor === 0)
    return `No expenses recorded for ${d.label}, so nothing to review.`;

  const wantCuts = d.expenseByCategory
    .filter((c) => c.needOrWant === "want" && c.totalMinor > 0)
    .map((c) => ({
      name: c.categoryName,
      total: c.totalMinor,
      saving: Math.round(c.totalMinor * WANT_CUT_SHARE),
    }))
    .sort((a, b) => b.saving - a.saving)
    .slice(0, 5);

  const previousByName = new Map(
    d.previousExpenseByCategory.map((c) => [c.categoryName, c.totalMinor]),
  );
  const rising = d.expenseByCategory
    .map((c) => ({
      name: c.categoryName,
      now: c.totalMinor,
      before: previousByName.get(c.categoryName) ?? 0,
    }))
    .filter((c) => c.before > 0 && c.now > c.before * 1.2 && c.now - c.before >= 50000)
    .sort((a, b) => b.now - b.before - (a.now - a.before))
    .slice(0, 3);

  const lines: string[] = [];
  if (wantCuts.length > 0) {
    const potential = wantCuts.reduce((sum, c) => sum + c.saving, 0);
    lines.push(`Spending on wants (things you can choose to skip) in ${d.label}:`);
    for (const c of wantCuts) {
      lines.push(
        `- ${c.name}: ${formatINR(c.total)}. Cutting it by 30% saves about ${formatINR(c.saving)}.`,
      );
    }
    lines.push(`Across these, a 30% cut would free up about ${formatINR(potential)}.`);
  } else {
    lines.push(`Nothing in ${d.label} is tagged as a want, so I can't point to obvious cuts.`);
  }

  if (rising.length > 0) {
    lines.push("");
    lines.push(`Categories that rose sharply versus ${d.previousLabel}:`);
    for (const r of rising) {
      const change = percentChange(r.before, r.now) ?? 0;
      lines.push(`- ${r.name}: up ${pct(change)} (${formatINR(r.before)} to ${formatINR(r.now)}).`);
    }
  }

  for (const leak of d.smallLeaks.slice(0, 2)) {
    lines.push("");
    lines.push(
      `${leak.categoryName} had ${leak.count} small purchases totalling ${formatINR(leak.totalMinor)}. Batching them into fewer trips would help.`,
    );
  }

  lines.push("");
  lines.push("Needs such as rent, fuel or medical are not counted as avoidable.");
  return lines.join("\n") + notePeriod(d);
}

function answerCompare(d: AssistantData): string {
  const s = d.summary;
  const p = d.previousSummary;
  const lines = [
    `${d.label} compared with ${d.previousLabel}:`,
    `- Expenses: ${formatINR(s.expenseMinor)} vs ${formatINR(p.expenseMinor)} (${signed(percentChange(p.expenseMinor, s.expenseMinor))})`,
    `- Income: ${formatINR(s.incomeMinor)} vs ${formatINR(p.incomeMinor)} (${signed(percentChange(p.incomeMinor, s.incomeMinor))})`,
    `- Net: ${formatINR(s.netMinor)} vs ${formatINR(p.netMinor)}`,
  ];
  const previousByName = new Map(
    d.previousExpenseByCategory.map((c) => [c.categoryName, c.totalMinor]),
  );
  const movers = d.expenseByCategory
    .map((c) => ({
      name: c.categoryName,
      delta: c.totalMinor - (previousByName.get(c.categoryName) ?? 0),
    }))
    .sort((a, b) => b.delta - a.delta);
  const up = movers.filter((m) => m.delta > 0).slice(0, 3);
  if (up.length > 0) {
    lines.push("Biggest increases:");
    for (const m of up) lines.push(`- ${m.name}: +${formatINR(m.delta)}`);
  }
  return lines.join("\n") + notePeriod(d);
}

function signed(change: number | null): string {
  if (change === null) return "no comparison";
  return `${change >= 0 ? "+" : ""}${change.toFixed(0)}%`;
}

function answerIncome(d: AssistantData): string {
  if (d.summary.incomeMinor === 0) return `No income recorded for ${d.label}.`;
  const lines = [`Income in ${d.label}: ${formatINR(d.summary.incomeMinor)}.`];
  for (const s of d.incomeBySource) lines.push(`- ${s.categoryName}: ${formatINR(s.totalMinor)}`);
  return lines.join("\n") + notePeriod(d);
}

function answerSavings(d: AssistantData): string {
  const s = d.summary;
  if (s.incomeMinor === 0)
    return `No income recorded for ${d.label}, so I can't work out a savings rate. Net is ${formatINR(s.netMinor)}.`;
  const rate = s.savingsRate === null ? "n/a" : pct(s.savingsRate * 100);
  const verdict = s.netMinor >= 0 ? "You kept money back" : "You spent more than you earned";
  return (
    `${verdict} in ${d.label}. Net ${formatINR(s.netMinor)}, savings rate ${rate}.` + notePeriod(d)
  );
}

function answerBudgets(d: AssistantData): string {
  if (d.budgets.length === 0)
    return "You have no active budgets. You can create one from the Budgets page.";
  const lines = ["Your budgets right now:"];
  for (const b of d.budgets) {
    const state =
      b.status === "over" ? "over" : b.status === "warning" ? "close to the limit" : "on track";
    lines.push(
      `- ${b.name}: ${formatINR(b.spentMinor)} of ${formatINR(b.amountMinor)} (${pct(b.pctUsed)}, ${state})`,
    );
  }
  return lines.join("\n");
}

function monthName(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number) as [number, number];
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

function answerCategoryTotal(d: AssistantData): string {
  const c = d.category;
  if (!c)
    return "I couldn't find that category in your list. Check the spelling against the Categories page.";
  if (c.totalMinor === 0) return `No spending on ${c.name} in ${d.label}.`;

  const share = d.summary.expenseMinor > 0 ? (c.totalMinor / d.summary.expenseMinor) * 100 : null;
  const shareText =
    share === null ? "" : `, which is ${pct(share)} of your expenses in that period`;
  const lines = [`You've spent ${formatINR(c.totalMinor)} on ${c.name} in ${d.label}${shareText}.`];

  const months = c.monthly.filter((m) => m.totalMinor > 0);
  if (months.length > 1) {
    const average = Math.round(c.totalMinor / months.length);
    lines.push(
      `That's about ${formatINR(average)} a month across ${months.length} months with spending.`,
    );
    const biggest = [...months].sort((a, b) => b.totalMinor - a.totalMinor)[0]!;
    lines.push(`Highest month: ${monthName(biggest.month)} at ${formatINR(biggest.totalMinor)}.`);
    lines.push("");
    for (const m of months) lines.push(`- ${monthName(m.month)}: ${formatINR(m.totalMinor)}`);
  }
  return lines.join("\n") + notePeriod(d);
}

function answerHelp(): string {
  return ["I can answer questions like:", ...EXAMPLE_QUESTIONS.map((q) => `- "${q}"`)].join("\n");
}

export function answer(intent: Intent, data: AssistantData): string {
  switch (intent) {
    case "totals":
      return answerTotals(data);
    case "topCategories":
      return answerTopCategories(data);
    case "topTransactions":
      return answerTopTransactions(data);
    case "avoidable":
      return answerAvoidable(data);
    case "compare":
      return answerCompare(data);
    case "income":
      return answerIncome(data);
    case "savings":
      return answerSavings(data);
    case "budgets":
      return answerBudgets(data);
    case "categoryTotal":
      return answerCategoryTotal(data);
    case "help":
      return answerHelp();
  }
}
