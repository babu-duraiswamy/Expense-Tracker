import { describe, expect, it } from "vitest";
import { parseSpokenAmount, parseVoiceEntry, type VoiceCategory } from "./parse-entry";

const CATS: VoiceCategory[] = [
  { id: "c1", name: "Entertainment", kind: "expense" },
  { id: "c2", name: "Food & dining", kind: "expense" },
  { id: "c3", name: "Fuel", kind: "expense" },
  { id: "c4", name: "Salary", kind: "income" },
  { id: "c5", name: "Groceries", kind: "expense" },
];
const TODAY = "2026-11-07";

describe("parseSpokenAmount", () => {
  it.each([
    ["700", 700],
    ["700 entertainment", 700],
    ["1,200 groceries", 1200],
    ["seven hundred", 700],
    ["two thousand five hundred", 2500],
    ["2 thousand five hundred", 2500],
    ["one lakh", 100000],
    ["fifteen rupees for fuel", 15],
    ["seventy five", 75],
  ])("parses %s as %i", (text, expected) => {
    expect(parseSpokenAmount(text)).toBe(expected);
  });

  it("returns null when no amount is spoken", () => {
    expect(parseSpokenAmount("entertainment")).toBeNull();
  });

  it("stops at the first word after the amount", () => {
    expect(parseSpokenAmount("seven hundred food and dining 50")).toBe(700);
  });
});

describe("parseVoiceEntry", () => {
  it("handles the example: 700, entertainment, today, cash", () => {
    const r = parseVoiceEntry("700 entertainment", { categories: CATS, today: TODAY });
    expect(r).toEqual({
      ok: true,
      entry: {
        type: "expense",
        amountMinor: 70000,
        categoryId: "c1",
        categoryName: "Entertainment",
        occurredOn: TODAY,
        paymentMode: "cash",
      },
    });
  });

  it("matches multi-word categories and synonyms", () => {
    const r = parseVoiceEntry("two hundred food", { categories: CATS, today: TODAY });
    expect(r.ok && r.entry.categoryName).toBe("Food & dining");
    const p = parseVoiceEntry("500 petrol", { categories: CATS, today: TODAY });
    expect(p.ok && p.entry.categoryName).toBe("Fuel");
  });

  it("reads income with net banking by default", () => {
    const r = parseVoiceEntry("income 60000 salary", { categories: CATS, today: TODAY });
    expect(r.ok && r.entry).toMatchObject({
      type: "income",
      categoryName: "Salary",
      paymentMode: "net_banking",
    });
  });

  it("reads yesterday and an explicit payment mode", () => {
    const r = parseVoiceEntry("1200 groceries upi yesterday", { categories: CATS, today: TODAY });
    expect(r.ok && r.entry).toMatchObject({
      occurredOn: "2026-11-06",
      paymentMode: "upi",
      categoryName: "Groceries",
    });
  });

  it("leaves the category empty when none is recognised, so the user can pick it", () => {
    const r = parseVoiceEntry("300 something", { categories: CATS, today: TODAY });
    expect(r.ok && r.entry.categoryId).toBeNull();
  });

  it("refuses an utterance with no amount", () => {
    const r = parseVoiceEntry("entertainment", { categories: CATS, today: TODAY });
    expect(r.ok).toBe(false);
  });
});
