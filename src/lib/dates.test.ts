import { describe, expect, it } from "vitest";
import { todayIST } from "./dates";

describe("todayIST", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(todayIST(new Date("2026-06-15T10:00:00Z"))).toBe("2026-06-15");
  });

  it("rolls over to the next day near midnight IST (UTC+5:30)", () => {
    // 19:00 UTC on Jan 1 = 00:30 IST on Jan 2
    expect(todayIST(new Date("2026-01-01T19:00:00Z"))).toBe("2026-01-02");
  });

  it("stays on the same day just before midnight IST", () => {
    // 18:29 UTC on Jan 1 = 23:59 IST on Jan 1
    expect(todayIST(new Date("2026-01-01T18:29:00Z"))).toBe("2026-01-01");
  });
});
