"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3Icon,
  HomeIcon,
  ReceiptIcon,
  TagsIcon,
  TargetIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: HomeIcon },
  { href: "/transactions", label: "Transactions", icon: ReceiptIcon },
  { href: "/budgets", label: "Budgets", icon: TargetIcon },
  { href: "/reports", label: "Reports", icon: BarChart3Icon },
  { href: "/categories", label: "Categories", icon: TagsIcon },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-muted/60 flex items-center gap-1 rounded-xl p-1">
      {LINKS.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-label={link.label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            <span className="hidden md:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
