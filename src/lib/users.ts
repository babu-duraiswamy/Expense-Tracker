import { db, schema } from "@/db";

/** Creates the user row on first successful sign-in. Idempotent. */
export async function ensureUser(email: string): Promise<void> {
  await db
    .insert(schema.users)
    .values({ email })
    .onConflictDoNothing({ target: schema.users.email });
}
