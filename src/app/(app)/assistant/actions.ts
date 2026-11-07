"use server";

import { requireUserId } from "@/lib/auth/session";
import { answerQuestion } from "@/lib/assistant/answer-question";

export async function askAssistant(question: string): Promise<string> {
  const userId = await requireUserId();
  return answerQuestion(userId, question);
}
