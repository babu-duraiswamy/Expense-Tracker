/**
 * drizzle-orm wraps driver errors as DrizzleQueryError, with the original
 * Postgres error (which carries .code, e.g. "23505" unique_violation)
 * attached as .cause. Walk the chain to find it.
 */
export function pgErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof error.code === "string") return error.code;
  if ("cause" in error) return pgErrorCode(error.cause);
  return undefined;
}

export const PG_UNIQUE_VIOLATION = "23505";

export function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === PG_UNIQUE_VIOLATION;
}
