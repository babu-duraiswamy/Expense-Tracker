import { describe, expect, it } from "vitest";
import {
  calendarYearPeriod,
  customPeriod,
  enumerateMonths,
  financialYearPeriod,
  fyStartYearFor,
  lastMonth,
  monthPeriod,
  previousPeriod,
  quarterCalendarPeriod,
  quarterFYPeriod,
  thisCalendarYear,
  thisFinancialYear,
  thisMonth,
  thisQuarterFY,
  weekPeriod,
} from "./periods";

describe("monthPeriod", () => {
  it("spans the full month", () => {
    expect(monthPeriod(2026, 6)).toMatchObject({ start: "2026-06-01", end: "2026-06-30" });
  });

  it("handles February in a leap year", () => {
    expect(monthPeriod(2028, 2)).toMatchObject({ start: "2028-02-01", end: "2028-02-29" });
  });

  it("handles February in a non-leap year", () => {
    expect(monthPeriod(2026, 2)).toMatchObject({ start: "2026-02-01", end: "2026-02-28" });
  });

  it("normalizes month 0 to December of the prior year", () => {
    expect(monthPeriod(2026, 0)).toMatchObject({ start: "2025-12-01", end: "2025-12-31" });
  });

  it("normalizes month 13 to January of the next year", () => {
    expect(monthPeriod(2026, 13)).toMatchObject({ start: "2027-01-01", end: "2027-01-31" });
  });
});

describe("previousPeriod for month", () => {
  it("rolls from January back to December of the prior year", () => {
    const jan = monthPeriod(2026, 1);
    expect(previousPeriod(jan)).toMatchObject({ start: "2025-12-01", end: "2025-12-31" });
  });
});

describe("fyStartYearFor", () => {
  it("1 April starts a new financial year", () => {
    expect(fyStartYearFor("2026-04-01")).toBe(2026);
  });

  it("31 March belongs to the previous financial year", () => {
    expect(fyStartYearFor("2026-03-31")).toBe(2025);
  });
});

describe("financialYearPeriod", () => {
  it("runs 1 Apr to 31 Mar", () => {
    expect(financialYearPeriod(2025)).toMatchObject({ start: "2025-04-01", end: "2026-03-31" });
  });

  it("previousPeriod steps back one FY", () => {
    const fy = financialYearPeriod(2025);
    expect(previousPeriod(fy)).toMatchObject({ start: "2024-04-01", end: "2025-03-31" });
  });
});

describe("calendarYearPeriod", () => {
  it("runs 1 Jan to 31 Dec", () => {
    expect(calendarYearPeriod(2026)).toMatchObject({ start: "2026-01-01", end: "2026-12-31" });
  });

  it("rolls 31 Dec/1 Jan: previousPeriod of 2026 is 2025", () => {
    expect(previousPeriod(calendarYearPeriod(2026))).toMatchObject({
      start: "2025-01-01",
      end: "2025-12-31",
    });
  });
});

describe("quarterCalendarPeriod", () => {
  it("Q1 is Jan-Mar", () => {
    expect(quarterCalendarPeriod(2026, 1)).toMatchObject({
      start: "2026-01-01",
      end: "2026-03-31",
    });
  });

  it("Q4 is Oct-Dec", () => {
    expect(quarterCalendarPeriod(2026, 4)).toMatchObject({
      start: "2026-10-01",
      end: "2026-12-31",
    });
  });

  it("previousPeriod of Q1 2026 is Q4 2025 (year rollover)", () => {
    expect(previousPeriod(quarterCalendarPeriod(2026, 1))).toMatchObject({
      start: "2025-10-01",
      end: "2025-12-31",
    });
  });
});

describe("quarterFYPeriod", () => {
  it("Q1 FY is Apr-Jun", () => {
    expect(quarterFYPeriod(2025, 1)).toMatchObject({ start: "2025-04-01", end: "2025-06-30" });
  });

  it("Q4 FY is Jan-Mar of the following calendar year", () => {
    expect(quarterFYPeriod(2025, 4)).toMatchObject({ start: "2026-01-01", end: "2026-03-31" });
  });

  it("previousPeriod of Q1 FY steps back into the prior FY's Q4 (31 Mar/1 Apr boundary)", () => {
    const q1 = quarterFYPeriod(2026, 1); // Apr-Jun 2026
    expect(previousPeriod(q1)).toMatchObject({ start: "2026-01-01", end: "2026-03-31" });
  });
});

describe("weekPeriod", () => {
  it("returns the Monday-Sunday week containing a Wednesday", () => {
    expect(weekPeriod("2026-06-17")).toMatchObject({ start: "2026-06-15", end: "2026-06-21" });
  });

  it("returns the same week when given the Sunday itself", () => {
    expect(weekPeriod("2026-06-21")).toMatchObject({ start: "2026-06-15", end: "2026-06-21" });
  });

  it("previousPeriod steps back exactly 7 days", () => {
    expect(previousPeriod(weekPeriod("2026-06-17"))).toMatchObject({
      start: "2026-06-08",
      end: "2026-06-14",
    });
  });
});

describe("customPeriod", () => {
  it("previousPeriod returns an equal-length window immediately before", () => {
    const custom = customPeriod("2026-06-10", "2026-06-19"); // 10 days
    expect(previousPeriod(custom)).toMatchObject({ start: "2026-05-31", end: "2026-06-09" });
  });

  it("handles a single-day custom period", () => {
    const custom = customPeriod("2026-06-10", "2026-06-10");
    expect(previousPeriod(custom)).toMatchObject({ start: "2026-06-09", end: "2026-06-09" });
  });
});

describe("quick options", () => {
  it("thisMonth uses the given today", () => {
    expect(thisMonth("2026-06-15")).toMatchObject({ start: "2026-06-01", end: "2026-06-30" });
  });

  it("lastMonth from January lands in December of the prior year", () => {
    expect(lastMonth("2026-01-15")).toMatchObject({ start: "2025-12-01", end: "2025-12-31" });
  });

  it("thisQuarterFY for a March date is Q4 of the prior FY start year", () => {
    expect(thisQuarterFY("2026-03-15")).toMatchObject({ start: "2026-01-01", end: "2026-03-31" });
  });

  it("thisFinancialYear for a March date belongs to the FY that started the previous April", () => {
    expect(thisFinancialYear("2026-03-15")).toMatchObject({
      start: "2025-04-01",
      end: "2026-03-31",
    });
  });

  it("thisCalendarYear", () => {
    expect(thisCalendarYear("2026-06-15")).toMatchObject({
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });
});

describe("enumerateMonths", () => {
  it("lists every month in range, inclusive", () => {
    expect(enumerateMonths("2026-01-05", "2026-03-20")).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("returns a single month when start and end are in the same month", () => {
    expect(enumerateMonths("2026-06-01", "2026-06-30")).toEqual(["2026-06"]);
  });

  it("rolls over a year boundary", () => {
    expect(enumerateMonths("2025-11-01", "2026-02-01")).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
      "2026-02",
    ]);
  });
});
