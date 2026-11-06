import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "./pg-error";

describe("isUniqueViolation", () => {
  it("detects a top-level Postgres error code", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
  });

  it("detects the code nested under drizzle-orm's DrizzleQueryError.cause", () => {
    const wrapped = new Error("Failed query: ...");
    (wrapped as unknown as { cause: unknown }).cause = { code: "23505" };
    expect(isUniqueViolation(wrapped)).toBe(true);
  });

  it("ignores unrelated Postgres error codes", () => {
    expect(isUniqueViolation({ code: "23503" })).toBe(false);
  });

  it("returns false for non-error values", () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation("boom")).toBe(false);
    expect(isUniqueViolation(new Error("plain"))).toBe(false);
  });
});
