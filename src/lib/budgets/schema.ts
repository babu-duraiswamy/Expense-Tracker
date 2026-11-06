import { z } from "zod";
import { amountMinorSchema } from "@/lib/money-schema";

export const budgetScopeSchema = z.enum(["total", "categories"]);
export const budgetPeriodTypeSchema = z.enum([
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
  "custom",
]);

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date");

export const createBudgetSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(60),
    amountMinor: amountMinorSchema,
    scope: budgetScopeSchema,
    categoryIds: z.array(z.string().uuid()).optional(),
    periodType: budgetPeriodTypeSchema,
    startDate: dateSchema,
    endDate: dateSchema.optional().or(z.literal("").transform(() => undefined)),
  })
  .refine((v) => v.scope === "total" || (v.categoryIds && v.categoryIds.length > 0), {
    message: "Choose at least one category",
    path: ["categoryIds"],
  })
  .refine((v) => v.periodType !== "custom" || v.endDate, {
    message: "Custom budgets need an end date",
    path: ["endDate"],
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: "End date must be after the start date",
    path: ["endDate"],
  });

export const updateBudgetSchema = createBudgetSchema.and(z.object({ id: z.string().uuid() }));
