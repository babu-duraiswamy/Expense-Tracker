import { describe, expect, it } from "vitest";
import { parseQuestion } from "./parse";

const TODAY = "2026-11-07";

describe("parseQuestion", () => {
  it("treats 'biggest expenses in July' as top categories for July", () => {
    const p = parseQuestion("What were my biggest expenses in July?", TODAY);
    expect(p.intent).toBe("topCategories");
    expect(p.period).toMatchObject({ start: "2026-07-01", end: "2026-07-31" });
    expect(p.periodLabelGiven).toBe(true);
  });

  it("recognises what could have been avoided", () => {
    expect(parseQuestion("What could I have avoided in July?", TODAY).intent).toBe("avoidable");
    expect(parseQuestion("where can I save more", TODAY).intent).toBe("avoidable");
  });

  it("resolves 'last month' against today", () => {
    const p = parseQuestion("How much did I spend last month?", TODAY);
    expect(p.intent).toBe("totals");
    expect(p.period).toMatchObject({ start: "2026-10-01", end: "2026-10-31" });
  });

  it("detects a comparison", () => {
    expect(parseQuestion("Compare this month with last month", TODAY).intent).toBe("compare");
  });

  it("separates single-transaction questions from category questions", () => {
    const p = parseQuestion("What are my biggest single transactions this year?", TODAY);
    expect(p.intent).toBe("topTransactions");
    expect(p.period).toMatchObject({ start: "2026-01-01", end: "2026-12-31" });
  });

  it("reads savings questions for a named month", () => {
    const p = parseQuestion("What is my savings rate in March?", TODAY);
    expect(p.intent).toBe("savings");
    expect(p.period).toMatchObject({ start: "2026-03-01", end: "2026-03-31" });
  });

  it("does not mistake 'cutlery' for a request to cut spending", () => {
    expect(parseQuestion("how much did I spend on cutlery", TODAY).intent).toBe("totals");
  });

  it("falls back to help and the current month when the question is unclear", () => {
    const p = parseQuestion("hello there", TODAY);
    expect(p.intent).toBe("help");
    expect(p.periodLabelGiven).toBe(false);
    expect(p.period).toMatchObject({ start: "2026-11-01", end: "2026-11-30" });
  });
});
