"use server";

import { requireUserId } from "@/lib/auth/session";
import {
  findTransactionMatches,
  type TransactionMatch,
  type TransactionMatchQuery,
} from "@/lib/transactions/find";

export async function findTransactionMatchesAction(
  query: TransactionMatchQuery,
): Promise<TransactionMatch[]> {
  const userId = await requireUserId();
  return findTransactionMatches(userId, query);
}
