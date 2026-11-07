import { describe, expect, it } from "vitest";
import { findCategory, parseQuestion } from "./parse";

const TODAY = "2026-11-07";
const CTX = {
  categories: ["Food & dining", "For Home", "Fuel", "Eating Out", "Gifts", "Travel", "Home loan"],
  earliest: "2026-01-02",
};

describe("parseQuestion", () => {
  it("treats 'biggest expenses in July' as top categories for July", () => {
    const p = parseQuestion("What were my biggest expenses in July?", TODAY, CTX);
    expect(p.intent).toBe("topCategories");
    expect(p.period).toMatchObject({ start: "2026-07-01", end: "2026-07-31" });
    expect(p.periodLabelGiven).toBe(true);
  });

  it("recognises what could have been avoided", () => {
    expect(parseQuestion("What could I have avoided in July?", TODAY, CTX).intent).toBe(
      "avoidable",
    );
    expect(parseQuestion("where can I save more", TODAY, CTX).intent).toBe("avoidable");
  });

  it("defaults avoidable questions to all time when no period is named", () => {
    const p = parseQuestion("What expenses could I have avoided?", TODAY, CTX);
    expect(p.period).toMatchObject({ start: "2026-01-02", end: "2026-11-07" });
    expect(p.periodLabelGiven).toBe(true);
  });

  it("resolves 'last month' against today", () => {
    const p = parseQuestion("How much did I spend last month?", TODAY, CTX);
    expect(p.intent).toBe("totals");
    expect(p.period).toMatchObject({ start: "2026-10-01", end: "2026-10-31" });
  });

  it("detects a comparison", () => {
    expect(parseQuestion("Compare this month with last month", TODAY, CTX).intent).toBe("compare");
  });

  it("separates single-transaction questions from category questions", () => {
    const p = parseQuestion("What are my biggest single transactions this year?", TODAY, CTX);
    expect(p.intent).toBe("topTransactions");
    expect(p.period).toMatchObject({ start: "2026-01-01", end: "2026-12-31" });
  });

  it("reads savings questions for a named month", () => {
    const p = parseQuestion("What is my savings rate in March?", TODAY, CTX);
    expect(p.intent).toBe("savings");
    expect(p.period).toMatchObject({ start: "2026-03-01", end: "2026-03-31" });
  });

  it("does not mistake 'cutlery' for a request to cut spending", () => {
    expect(parseQuestion("how much did I spend on cutlery", TODAY, CTX).intent).toBe("totals");
  });

  it("recognises a category and asks across all months for 'overall'", () => {
    const p = parseQuestion("In all these months, how much have I spent For Home?", TODAY, CTX);
    expect(p.intent).toBe("categoryTotal");
    expect(p.category).toBe("For Home");
    expect(p.period).toMatchObject({ start: "2026-01-02", end: "2026-11-07" });
  });

  it("uses all time for a category with no period", () => {
    const p = parseQuestion("how much on fuel?", TODAY, CTX);
    expect(p.intent).toBe("categoryTotal");
    expect(p.category).toBe("Fuel");
    expect(p.period.start).toBe("2026-01-02");
  });

  it("respects a named month for a category", () => {
    const p = parseQuestion("how much did I spend on Gifts in July", TODAY, CTX);
    expect(p.category).toBe("Gifts");
    expect(p.period).toMatchObject({ start: "2026-07-01", end: "2026-07-31" });
  });

  it("falls back to help and the current month when the question is unclear", () => {
    const p = parseQuestion("hello there", TODAY, CTX);
    expect(p.intent).toBe("help");
    expect(p.periodLabelGiven).toBe(false);
    expect(p.period).toMatchObject({ start: "2026-11-01", end: "2026-11-30" });
  });
});

describe("findCategory", () => {
  it("prefers the longest matching name", () => {
    expect(findCategory("spent on home loan", ["Home", "Home loan"])).toBe("Home loan");
  });

  it("matches whole words only", () => {
    expect(findCategory("my fuelling costs", ["Fuel"])).toBeNull();
    expect(findCategory("fuel costs", ["Fuel"])).toBe("Fuel");
  });

  it("matches names containing punctuation", () => {
    expect(findCategory("how much on food & dining", ["Food & dining"])).toBe("Food & dining");
  });
});
