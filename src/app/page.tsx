import { formatINR } from "@/lib/money";

// Placeholder home page (F-SETUP-01). Replaced by the dashboard in F-DASH-01.
export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-semibold">Finance Tracker</h1>
      <p className="text-neutral-500">Skeleton is running. Next: F-AUTH-01.</p>
      <p className="font-mono text-sm" data-testid="format-check">
        {formatINR(12345600)}
      </p>
    </main>
  );
}
