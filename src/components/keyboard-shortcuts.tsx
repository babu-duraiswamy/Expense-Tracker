"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { isTyping } from "@/app/(app)/transactions/filters";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const OPEN_SHORTCUTS_EVENT = "open-shortcuts";

const GO_TO: Record<string, { href: string; label: string }> = {
  d: { href: "/", label: "Dashboard" },
  t: { href: "/transactions", label: "Transactions" },
  b: { href: "/budgets", label: "Budgets" },
  r: { href: "/reports", label: "Reports" },
  c: { href: "/categories", label: "Categories" },
};

export const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ["n"], action: "New transaction" },
  { keys: ["g", "d"], action: "Go to Dashboard" },
  { keys: ["g", "t"], action: "Go to Transactions" },
  { keys: ["g", "b"], action: "Go to Budgets" },
  { keys: ["g", "r"], action: "Go to Reports" },
  { keys: ["g", "c"], action: "Go to Categories" },
  { keys: ["/"], action: "Search transactions" },
  { keys: ["Esc"], action: "Close dialogs" },
  { keys: ["Ctrl + Enter"], action: "Save the open form" },
  { keys: ["?"], action: "Show this list" },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    let awaitingGo = false;
    let goTimer: ReturnType<typeof setTimeout> | undefined;

    function clearGo() {
      awaitingGo = false;
      if (goTimer) clearTimeout(goTimer);
    }

    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTyping(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;

      if (awaitingGo) {
        const target = GO_TO[e.key.toLowerCase()];
        clearGo();
        if (target) {
          e.preventDefault();
          router.push(target.href);
        }
        return;
      }

      switch (e.key) {
        case "n":
          e.preventDefault();
          router.push("/transactions/new");
          break;
        case "g":
          e.preventDefault();
          awaitingGo = true;
          goTimer = setTimeout(clearGo, 1200);
          break;
        case "?":
          e.preventDefault();
          setHelpOpen(true);
          break;
      }
    }

    function onOpenEvent() {
      setHelpOpen(true);
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SHORTCUTS_EVENT, onOpenEvent);
    return () => {
      clearGo();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SHORTCUTS_EVENT, onOpenEvent);
    };
  }, [router]);

  return (
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Shortcuts work anywhere except while typing in a field.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col divide-y">
          {SHORTCUTS.map((s) => (
            <li key={s.action} className="flex items-center justify-between py-2.5 text-sm">
              <span>{s.action}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={`${k}-${i}`} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground text-xs">then</span>}
                    <kbd className="bg-muted rounded-md border px-1.5 py-0.5 font-mono text-xs">
                      {k}
                    </kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
