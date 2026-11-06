import Link from "next/link";
import { auth, signOut } from "@/auth";
import { formatINR } from "@/lib/money";

// Placeholder dashboard (F-SETUP-01 / F-AUTH-01). Replaced in F-DASH-01.
export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">Finance Tracker</h1>
      <p className="text-neutral-500">Signed in as {session?.user?.email}. Next: F-TXN-01.</p>
      <p className="font-mono text-sm" data-testid="format-check">
        {formatINR(12345600)}
      </p>
      <Link href="/categories" className="text-sm underline">
        Manage categories
      </Link>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button type="submit" className="rounded border border-neutral-300 px-4 py-2 text-sm">
          Sign out
        </button>
      </form>
    </main>
  );
}
