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
        note: null,
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

describe("comments, categories and the for/4 mishearing", () => {
  const PERSONAL = [{ id: "p1", name: "Personal care", kind: "expense" as const }, ...CATS];
  const HOME = [{ id: "h1", name: "For Home", kind: "expense" as const }, ...CATS];

  it("takes a spoken comment as the note, keeping its wording", () => {
    const r = parseVoiceEntry("add personal care 830 expense comment For eggs", {
      categories: PERSONAL,
      today: TODAY,
    });
    expect(r.ok && r.entry).toMatchObject({
      amountMinor: 83000,
      categoryName: "Personal care",
      note: "For eggs",
    });
  });

  it("keeps the note empty when none is spoken", () => {
    const r = parseVoiceEntry("700 entertainment", { categories: CATS, today: TODAY });
    expect(r.ok && r.entry.note).toBeNull();
  });

  it("matches 'home' to the category For Home", () => {
    const r = parseVoiceEntry("add 150 for home", { categories: HOME, today: TODAY });
    expect(r.ok && r.entry).toMatchObject({ amountMinor: 15000, categoryName: "For Home" });
  });

  it("reads 'for' that was heard as '4' between the amount and the category", () => {
    const r = parseVoiceEntry("150 4 home", { categories: HOME, today: TODAY });
    expect(r.ok && r.entry).toMatchObject({ amountMinor: 15000, categoryName: "For Home" });
  });

  it("does not turn a real amount ending in 4 into a word", () => {
    const r = parseVoiceEntry("154 home", { categories: HOME, today: TODAY });
    expect(r.ok && r.entry.amountMinor).toBe(15400);
  });
});

describe("amount, category and comment in order", () => {
  const CATS_EATING = [
    { id: "e1", name: "Eating Out", kind: "expense" as const },
    { id: "e2", name: "For Home", kind: "expense" as const },
    { id: "e3", name: "Personal care", kind: "expense" as const },
  ];

  it("reads '140 Eating Out Annapoorna' as amount, category and comment", () => {
    const r = parseVoiceEntry("140 Eating Out Annapoorna", {
      categories: CATS_EATING,
      today: TODAY,
    });
    expect(r.ok && r.entry).toMatchObject({
      amountMinor: 14000,
      categoryName: "Eating Out",
      note: "Annapoorna",
    });
  });

  it("reads a comment that comes before the category too", () => {
    const r = parseVoiceEntry("add 830 personal care for eggs", {
      categories: CATS_EATING,
      today: TODAY,
    });
    expect(r.ok && r.entry).toMatchObject({
      amountMinor: 83000,
      categoryName: "Personal care",
      note: "for eggs",
    });
  });

  it("keeps the spelling of the comment as spoken", () => {
    const r = parseVoiceEntry("140 eating out Annapoorna", {
      categories: CATS_EATING,
      today: TODAY,
    });
    expect(r.ok && r.entry.note).toBe("Annapoorna");
  });

  it("does not put payment or filler words into the comment", () => {
    const r = parseVoiceEntry("add 140 eating out annapoorna upi", {
      categories: CATS_EATING,
      today: TODAY,
    });
    expect(r.ok && r.entry).toMatchObject({ note: "annapoorna", paymentMode: "upi" });
  });

  it("finds 'for home' with the amount first and no comment left over", () => {
    const r = parseVoiceEntry("add 150 for home", { categories: CATS_EATING, today: TODAY });
    expect(r.ok && r.entry).toMatchObject({ categoryName: "For Home", note: null });
  });

  it("keeps the date out of the comment", () => {
    const r = parseVoiceEntry("140 eating out annapoorna yesterday", {
      categories: CATS_EATING,
      today: TODAY,
    });
    expect(r.ok && r.entry).toMatchObject({ occurredOn: "2026-11-06", note: "annapoorna" });
  });
});
