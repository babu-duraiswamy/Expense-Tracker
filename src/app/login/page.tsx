import { PieChartIcon, PiggyBankIcon, WalletCardsIcon } from "lucide-react";
import { LoginForm } from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const HIGHLIGHTS = [
  { icon: PieChartIcon, text: "See where every rupee goes, by category and period" },
  { icon: PiggyBankIcon, text: "Budgets and tips that point to real savings" },
];

export default function LoginPage() {
  return (
    <main className="via-background relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 p-6 dark:from-indigo-950/40 dark:to-violet-950/40">
      <div className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-violet-400/20 blur-3xl" />

      <div className="relative grid w-full max-w-4xl items-center gap-10 md:grid-cols-2">
        <div className="hidden flex-col gap-6 md:flex">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg">
            <WalletCardsIcon className="size-6" />
          </span>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Finance Tracker</h1>
            <p className="text-muted-foreground mt-3 max-w-sm text-base leading-relaxed">
              Log a rupee in seconds, understand your month at a glance, and keep your budgets
              honest.
            </p>
          </div>
          <ul className="flex flex-col gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="bg-background flex size-8 items-center justify-center rounded-lg shadow-sm">
                  <Icon className="text-primary size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-2 text-center md:hidden">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <WalletCardsIcon className="size-5" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">Finance Tracker</h1>
          </div>
          <Card className="bg-background/80 w-full rounded-3xl shadow-xl backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl">Welcome back</CardTitle>
              <CardDescription>Sign in to continue to your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
