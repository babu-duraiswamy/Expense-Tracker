import { listBudgetsWithProgress } from "@/lib/budgets/queries";
import { listCategoriesForFilter } from "@/lib/transactions/queries";
import { todayIST } from "@/lib/dates";
import { previousPeriod } from "@/lib/periods";
import {
  getCategoryBreakdown,
  getCategoryMonthly,
  getEarliestTransactionDate,
  getPeriodSummary,
  getSmallTransactionGroups,
  getTopExpenses,
} from "@/lib/reports/queries";
import { answer, type AssistantData } from "./answer";
import { parseQuestion } from "./parse";

const MAX_QUESTION_LENGTH = 300;
const EMPTY_SUMMARY = { incomeMinor: 0, expenseMinor: 0, netMinor: 0, savingsRate: null };

export async function answerQuestion(
  userId: string,
  question: string,
  today: string = todayIST(),
): Promise<string> {
  const text = question.trim().slice(0, MAX_QUESTION_LENGTH);
  if (!text) return "Ask me something about your spending.";

  const [categories, earliest] = await Promise.all([
    listCategoriesForFilter(userId),
    getEarliestTransactionDate(userId),
  ]);
  const parsed = parseQuestion(text, today, {
    categories: categories.filter((c) => c.kind === "expense").map((c) => c.name),
    earliest,
  });

  const period = parsed.period;
  const isAllTime = period.label.startsWith("All time");
  const previous = previousPeriod(period);
  const categoryRow = parsed.category
    ? categories.find((c) => c.kind === "expense" && c.name === parsed.category)
    : undefined;

  const [
    summary,
    previousSummary,
    expenses,
    previousExpenses,
    incomeSources,
    topTransactions,
    smallLeaks,
    budgets,
    monthly,
  ] = await Promise.all([
    getPeriodSummary(userId, period),
    isAllTime ? Promise.resolve(EMPTY_SUMMARY) : getPeriodSummary(userId, previous),
    getCategoryBreakdown(userId, period, "expense"),
    isAllTime ? Promise.resolve([]) : getCategoryBreakdown(userId, previous, "expense"),
    getCategoryBreakdown(userId, period, "income"),
    getTopExpenses(userId, period, 5),
    getSmallTransactionGroups(userId, period),
    parsed.intent === "budgets" ? listBudgetsWithProgress(userId, today) : Promise.resolve([]),
    parsed.intent === "categoryTotal" && categoryRow
      ? getCategoryMonthly(userId, categoryRow.id, period)
      : Promise.resolve(null),
  ]);

  const categoryDetail =
    parsed.intent === "categoryTotal" && parsed.category
      ? categoryRow
        ? {
            name: parsed.category,
            totalMinor: expenses.find((e) => e.categoryName === parsed.category)?.totalMinor ?? 0,
            monthly: monthly ?? [],
          }
        : null
      : undefined;

  const data: AssistantData = {
    category: categoryDetail,
    label: period.label,
    previousLabel: isAllTime ? "" : previous.label,
    periodGiven: parsed.periodLabelGiven,
    summary,
    previousSummary,
    expenseByCategory: expenses,
    previousExpenseByCategory: previousExpenses,
    incomeBySource: incomeSources.map((s) => ({
      categoryName: s.categoryName,
      totalMinor: s.totalMinor,
    })),
    topTransactions: topTransactions.map((t) => ({
      categoryName: t.categoryName,
      occurredOn: t.occurredOn,
      amountMinor: t.amountMinor,
      note: t.note,
    })),
    smallLeaks,
    budgets: budgets.map((b) => ({
      name: b.name,
      status: b.status,
      pctUsed: b.pctUsed,
      spentMinor: b.spentMinor,
      amountMinor: b.amountMinor,
    })),
  };

  return answer(parsed.intent, data);
}
