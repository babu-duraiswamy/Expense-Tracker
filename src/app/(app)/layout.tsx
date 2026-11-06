import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { auth } from "@/auth";
import { AppNav } from "@/components/app-nav";
import { UserMenu } from "@/components/user-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="bg-muted/30 min-h-dvh">
      <header className="bg-background sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="shrink-0 text-lg font-semibold tracking-tight">
            <span className="sm:hidden">FT</span>
            <span className="hidden sm:inline">Finance Tracker</span>
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 overflow-x-auto">
              <AppNav />
            </div>
            <Link
              href="/transactions/new"
              aria-label="Add transaction"
              className={cn(buttonVariants({ size: "icon" }), "shrink-0")}
            >
              <PlusIcon />
            </Link>
            {session?.user?.email && <UserMenu email={session.user.email} />}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
