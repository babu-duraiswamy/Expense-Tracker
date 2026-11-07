"use server";

import { requireUserId } from "@/lib/auth/session";
import { todayIST } from "@/lib/dates";
import { listBudgetsWithProgress } from "@/lib/budgets/queries";
import { answer, type AssistantData } from "@/lib/assistant/answer";
import { parseQuestion } from "@/lib/assistant/parse";
import { previousPeriod } from "@/lib/periods";
import {
  getCategoryBreakdown,
  getPeriodSummary,
  getSmallTransactionGroups,
  getTopExpenses,
} from "@/lib/reports/queries";

const MAX_QUESTION_LENGTH = 300;

export async function askAssistant(question: string): Promise<string> {
  const userId = await requireUserId();
  const text = question.trim().slice(0, MAX_QUESTION_LENGTH);
  if (!text) return "Ask me something about your spending.";

  const today = todayIST();
  const parsed = parseQuestion(text, today);
  const period = parsed.period;
  const previous = previousPeriod(period);

  const [
    summary,
    previousSummary,
    expenses,
    previousExpenses,
    incomeSources,
    topTransactions,
    smallLeaks,
    budgets,
  ] = await Promise.all([
    getPeriodSummary(userId, period),
    getPeriodSummary(userId, previous),
    getCategoryBreakdown(userId, period, "expense"),
    getCategoryBreakdown(userId, previous, "expense"),
    getCategoryBreakdown(userId, period, "income"),
    getTopExpenses(userId, period, 5),
    getSmallTransactionGroups(userId, period),
    parsed.intent === "budgets" ? listBudgetsWithProgress(userId, today) : Promise.resolve([]),
  ]);

  const data: AssistantData = {
    label: period.label,
    previousLabel: previous.label,
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
