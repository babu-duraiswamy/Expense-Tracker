import { z } from "zod";

/** Shared between client and server (rule 6). */
export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(60, "Keep it under 60 characters");

export const categoryKindSchema = z.enum(["expense", "income"]);
export const needOrWantSchema = z.enum(["need", "want"]);

export const createCategorySchema = z
  .object({
    name: categoryNameSchema,
    kind: categoryKindSchema,
    needOrWant: needOrWantSchema.optional(),
  })
  .refine((v) => v.kind === "expense" || v.needOrWant === undefined, {
    message: "Need/Want only applies to expense categories",
    path: ["needOrWant"],
  });

export const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: categoryNameSchema,
  needOrWant: needOrWantSchema.optional(),
});
