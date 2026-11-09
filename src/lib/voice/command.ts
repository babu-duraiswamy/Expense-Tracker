import { toPaise } from "@/lib/money";
import {
  extractDate,
  findCategory,
  normalizeTranscript,
  parseSpokenAmount,
  parseVoiceEntry,
  type VoiceCategory,
  type VoiceEntry,
} from "./parse-entry";

export type VoiceCommand =
  | { kind: "add"; entry: VoiceEntry }
  | {
      kind: "delete";
      amountMinor: number | null;
      categoryId: string | null;
      categoryName: string | null;
      occurredOn: string | null;
    };

const DELETE_WORDS = /\b(delete|remove|cancel|undo)\b/;

/** Decides whether a spoken phrase adds a transaction or deletes one, and reads the details from it. */
export function parseVoiceCommand(
  text: string,
  options: { categories: VoiceCategory[]; today: string },
): { ok: true; command: VoiceCommand } | { ok: false; reason: string } {
  const lower = normalizeTranscript(text).toLowerCase();

  if (DELETE_WORDS.test(lower)) {
    const { date, rest } = extractDate(text, options.today);
    const amount = parseSpokenAmount(rest);
    const category =
      findCategory(lower, options.categories, "expense") ??
      findCategory(lower, options.categories, "income");

    if (amount === null && category === null && date === null) {
      return {
        ok: false,
        reason: 'Say what to delete, for example "delete 700 entertainment yesterday".',
      };
    }
    return {
      ok: true,
      command: {
        kind: "delete",
        amountMinor: amount === null ? null : toPaise(amount.toString()),
        categoryId: category?.id ?? null,
        categoryName: category?.name ?? null,
        occurredOn: date,
      },
    };
  }

  const added = parseVoiceEntry(text, options);
  if (!added.ok) return added;
  return { ok: true, command: { kind: "add", entry: added.entry } };
}
