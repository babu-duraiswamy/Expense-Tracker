import { describe, expect, it } from "vitest";
import { createCategorySchema, categoryNameSchema, updateCategorySchema } from "./schema";

describe("categoryNameSchema", () => {
  it("trims whitespace", () => {
    expect(categoryNameSchema.parse("  Food  ")).toBe("Food");
  });

  it.each(["", "   "])("rejects empty name %p", (name) => {
    expect(categoryNameSchema.safeParse(name).success).toBe(false);
  });

  it("rejects names over 60 characters", () => {
    expect(categoryNameSchema.safeParse("a".repeat(61)).success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("accepts an expense category with needOrWant", () => {
    const result = createCategorySchema.safeParse({
      name: "Food",
      kind: "expense",
      needOrWant: "want",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an income category without needOrWant", () => {
    const result = createCategorySchema.safeParse({ name: "Salary", kind: "income" });
    expect(result.success).toBe(true);
  });

  it("rejects needOrWant on an income category", () => {
    const result = createCategorySchema.safeParse({
      name: "Salary",
      kind: "income",
      needOrWant: "need",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid kind", () => {
    const result = createCategorySchema.safeParse({ name: "Food", kind: "transfer" });
    expect(result.success).toBe(false);
  });
});

describe("updateCategorySchema", () => {
  it("requires a valid uuid id", () => {
    expect(updateCategorySchema.safeParse({ id: "not-a-uuid", name: "Food" }).success).toBe(false);
  });
});
