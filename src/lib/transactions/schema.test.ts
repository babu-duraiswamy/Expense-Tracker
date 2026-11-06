import { describe, expect, it } from "vitest";
import { createTransactionSchema } from "./schema";

const base = {
  type: "expense" as const,
  categoryId: "11111111-1111-1111-8111-111111111111",
  occurredOn: "2026-06-15",
  paymentMode: "upi" as const,
};

describe("createTransactionSchema", () => {
  it("parses a valid expense and converts amount to paise", () => {
    const result = createTransactionSchema.safeParse({ ...base, amountMinor: "249.50" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amountMinor).toBe(24950);
  });

  it("rejects a zero or negative amount", () => {
    expect(createTransactionSchema.safeParse({ ...base, amountMinor: "0" }).success).toBe(false);
    expect(createTransactionSchema.safeParse({ ...base, amountMinor: "-5" }).success).toBe(false);
  });

  it("rejects a non-numeric amount", () => {
    expect(createTransactionSchema.safeParse({ ...base, amountMinor: "abc" }).success).toBe(false);
  });

  it("rejects an invalid date format", () => {
    expect(
      createTransactionSchema.safeParse({ ...base, amountMinor: "100", occurredOn: "15/06/2026" })
        .success,
    ).toBe(false);
  });

  it("rejects an invalid category id", () => {
    expect(
      createTransactionSchema.safeParse({ ...base, amountMinor: "100", categoryId: "not-a-uuid" })
        .success,
    ).toBe(false);
  });

  it("treats an empty note as undefined", () => {
    const result = createTransactionSchema.safeParse({ ...base, amountMinor: "100", note: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBeUndefined();
  });

  it("rejects a note over 280 characters", () => {
    const result = createTransactionSchema.safeParse({
      ...base,
      amountMinor: "100",
      note: "a".repeat(281),
    });
    expect(result.success).toBe(false);
  });
});
