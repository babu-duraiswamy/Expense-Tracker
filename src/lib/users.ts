import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { seedDefaultCategories } from "@/lib/categories/queries";

/** Creates the user row and seeds default categories on sign-in. Both steps are idempotent. */
export async function ensureUser(email: string): Promise<{ id: string; email: string }> {
  const [existing] = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.email, email));

  const user =
    existing ??
    (
      await db
        .insert(schema.users)
        .values({ email })
        .returning({ id: schema.users.id, email: schema.users.email })
    )[0]!;

  await seedDefaultCategories(user.id);
  return user;
}
