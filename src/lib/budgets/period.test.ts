import { describe, expect, it } from "vitest";
import { currentBudgetPeriod, daysLeftInPeriod } from "./period";

describe("currentBudgetPeriod", () => {
  it("weekly: first window when today is within it", () => {
    const window = currentBudgetPeriod(
      { periodType: "weekly", startDate: "2026-06-01", endDate: null },
      "2026-06-04",
    );
    expect(window).toEqual({ start: "2026-06-01", end: "2026-06-07" });
  });

  it("weekly: rolls forward to the current week several weeks later", () => {
    const window = currentBudgetPeriod(
      { periodType: "weekly", startDate: "2026-06-01", endDate: null },
      "2026-06-22",
    );
    expect(window).toEqual({ start: "2026-06-22", end: "2026-06-28" });
  });

  it("monthly: rolls forward across several months", () => {
    const window = currentBudgetPeriod(
      { periodType: "monthly", startDate: "2026-01-15", endDate: null },
      "2026-06-20",
    );
    expect(window).toEqual({ start: "2026-06-15", end: "2026-07-14" });
  });

  it("quarterly: finds the window three months on", () => {
    const window = currentBudgetPeriod(
      { periodType: "quarterly", startDate: "2026-01-01", endDate: null },
      "2026-05-01",
    );
    expect(window).toEqual({ start: "2026-04-01", end: "2026-06-30" });
  });

  it("yearly: rolls forward across a leap year boundary", () => {
    const window = currentBudgetPeriod(
      { periodType: "yearly", startDate: "2027-01-01", endDate: null },
      "2028-02-01",
    );
    expect(window).toEqual({ start: "2028-01-01", end: "2028-12-31" });
  });

  it("custom: always returns the fixed window regardless of today", () => {
    const window = currentBudgetPeriod(
      { periodType: "custom", startDate: "2026-03-01", endDate: "2026-03-15" },
      "2026-08-01",
    );
    expect(window).toEqual({ start: "2026-03-01", end: "2026-03-15" });
  });

  it("returns the first window when today is before the start date", () => {
    const window = currentBudgetPeriod(
      { periodType: "monthly", startDate: "2026-06-01", endDate: null },
      "2026-05-01",
    );
    expect(window).toEqual({ start: "2026-06-01", end: "2026-06-30" });
  });
});

describe("daysLeftInPeriod", () => {
  it("counts inclusive days remaining", () => {
    expect(daysLeftInPeriod({ start: "2026-06-01", end: "2026-06-30" }, "2026-06-29")).toBe(2);
  });

  it("is 1 on the last day", () => {
    expect(daysLeftInPeriod({ start: "2026-06-01", end: "2026-06-30" }, "2026-06-30")).toBe(1);
  });

  it("is 0 once the period has ended", () => {
    expect(daysLeftInPeriod({ start: "2026-06-01", end: "2026-06-30" }, "2026-07-01")).toBe(0);
  });
});
