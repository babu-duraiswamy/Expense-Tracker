import Link from "next/link";
import { ArrowRightIcon, ReceiptTextIcon, TagsIcon, TargetIcon, WalletIcon } from "lucide-react";
import { auth } from "@/auth";
import { formatINR } from "@/lib/money";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_LINKS: {
  href: string;
  icon: typeof TagsIcon;
  title: string;
  description: string;
  status: "ready" | "soon";
}[] = [
  {
    href: "/categories",
    icon: TagsIcon,
    title: "Categories",
    description: "Manage expense and income categories.",
    status: "ready",
  },
  {
    href: "/transactions",
    icon: ReceiptTextIcon,
    title: "Transactions",
    description: "Log income and expenses.",
    status: "ready",
  },
  {
    href: "/budgets",
    icon: WalletIcon,
    title: "Budgets",
    description: "Set flexible budgets per category or period.",
    status: "ready",
  },
  {
    href: "/reports",
    icon: TargetIcon,
    title: "Reports",
    description: "See where your money goes, for any period.",
    status: "ready",
  },
];

// Placeholder dashboard (F-SETUP-01 / F-AUTH-01 / F-CAT-01). Replaced in F-DASH-01.
export default async function Home() {
  const session = await auth();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Signed in as {session?.user?.email}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {QUICK_LINKS.map(({ href, icon: Icon, title, description, status }) => (
          <Card key={title} className={status === "soon" ? "opacity-70" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Icon className="text-muted-foreground size-4" />
                  {title}
                </span>
                {status === "soon" ? (
                  <Badge variant="secondary">Coming soon</Badge>
                ) : (
                  <Badge>Ready</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-4">
              <p className="text-muted-foreground text-sm">{description}</p>
              {status === "ready" && (
                <Link
                  href={href}
                  className="text-primary flex shrink-0 items-center gap-1 text-sm font-medium hover:underline"
                >
                  Open
                  <ArrowRightIcon className="size-3.5" />
                </Link>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-muted-foreground text-xs" data-testid="format-check">
        Currency formatting sample: {formatINR(12345600)}
      </p>
    </div>
  );
}
