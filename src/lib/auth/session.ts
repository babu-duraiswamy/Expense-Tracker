import { auth } from "@/auth";

/** Every server action / query must call this to enforce ownership (rule 3). */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Not authenticated");
  return userId;
}
