import Link from "next/link";
import { PlusIcon, WalletCardsIcon } from "lucide-react";
import { auth } from "@/auth";
import { AppNav } from "@/components/app-nav";
import { UserMenu } from "@/components/user-menu";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { MobileNav } from "@/components/mobile-nav";
import { AssistantPanel } from "@/components/assistant/assistant-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="via-background to-background min-h-dvh bg-gradient-to-b from-indigo-50/60 dark:from-indigo-950/20">
      <header className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <WalletCardsIcon className="size-5" />
            </span>
            <span className="hidden flex-col leading-tight sm:flex">
              <span className="text-[15px] font-semibold tracking-tight">Finance Tracker</span>
              <span className="text-muted-foreground text-[11px]">Personal money, clearly</span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden min-w-0 [scrollbar-width:none] overflow-x-auto md:block [&::-webkit-scrollbar]:hidden">
              <AppNav />
            </div>
            <Link
              href="/transactions/new"
              aria-label="Add transaction"
              className={cn(
                buttonVariants({ size: "icon" }),
                "hidden shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm hover:opacity-90 md:inline-flex",
              )}
            >
              <PlusIcon />
            </Link>
            {session?.user?.email && <UserMenu email={session.user.email} />}
          </div>
        </div>
      </header>
      <KeyboardShortcuts />
      <main className="mx-auto max-w-6xl px-5 pt-8 pb-28 sm:px-8 sm:pt-12 md:pb-16">
        {children}
      </main>
      <MobileNav />
      <AssistantPanel />
    </div>
  );
}
