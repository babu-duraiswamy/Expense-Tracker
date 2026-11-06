import { z } from "zod";
import { toPaise } from "./money";

/** A rupee amount input (e.g. "249.50"), validated and converted to integer paise. */
export const amountMinorSchema = z.string().transform((val, ctx) => {
  try {
    const paise = toPaise(val);
    if (paise <= 0) throw new Error("must be positive");
    return paise;
  } catch {
    ctx.addIssue({ code: "custom", message: "Enter a valid amount greater than 0" });
    return z.NEVER;
  }
});
