import { Loader2Icon } from "lucide-react";

export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3"
    >
      <Loader2Icon className="text-primary size-6 animate-spin" aria-hidden />
      <span className="text-muted-foreground text-sm">Loading…</span>
    </div>
  );
}
