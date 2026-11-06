import { describe, expect, it } from "vitest";
import { formatINR, paiseToInput, percentChange, sumPaise, toPaise } from "./money";

describe("toPaise", () => {
  it.each([
    ["249", 24900],
    ["249.5", 24950],
    ["249.50", 24950],
    ["0.01", 1],
    ["1,23,456.78", 12345678],
    [" ₹ 100 ", 10000],
  ])("parses %s → %i", (input, expected) => {
    expect(toPaise(input)).toBe(expected);
  });

  it("avoids float errors (0.1 + 0.2 style)", () => {
    expect(toPaise("0.29")).toBe(29);
    expect(toPaise("1.15")).toBe(115);
  });

  it.each(["", "abc", "1.234", "-5", "1.2.3", "."])("rejects %s", (input) => {
    expect(() => toPaise(input)).toThrow();
  });
});

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(12345600)).toBe("₹1,23,456.00");
  });

  it("formats whole rupees", () => {
    expect(formatINR(12345600, { whole: true })).toBe("₹1,23,456");
  });
});

describe("paiseToInput", () => {
  it("round-trips with toPaise", () => {
    expect(paiseToInput(24950)).toBe("249.50");
    expect(toPaise(paiseToInput(24950))).toBe(24950);
    expect(paiseToInput(5)).toBe("0.05");
  });
});

describe("sumPaise / percentChange", () => {
  it("sums", () => {
    expect(sumPaise([100, 250, 1])).toBe(351);
  });

  it("computes percent change", () => {
    expect(percentChange(1000, 1500)).toBe(50);
    expect(percentChange(0, 100)).toBeNull();
  });
});
