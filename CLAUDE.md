# CLAUDE.md

Personal finance tracker (expenses + income now, investments later). Single user. This is a **learning project**: the owner is learning to build end to end with AI, so explain your plan before coding and keep changes small and readable.

## Source of truth
- `docs/RAD.md`: requirements (FR-*, NFR-*), data model, architecture
- `docs/FEATURES.md`: features (F-*) with acceptance criteria, dependencies and build order

Always work on **one feature ID at a time** (e.g. F-TXN-01). Don't build ahead of the build order or add features that aren't in FEATURES.md without asking.

## Stack
Next.js (App Router, TypeScript strict) · Tailwind v4 · shadcn/ui · Recharts · Zod · Auth.js v5 (Google, JWT sessions, **no DB adapter**) · Drizzle ORM · Neon Postgres · Vercel · Vitest · Playwright

## Commands
- `npm run dev`: local dev server
- `npm run check`: lint + typecheck + unit tests (run before saying a feature is done)
- `npm run test:e2e`: Playwright
- `npm run db:generate`: create a migration from `src/db/schema.ts`
- `npm run db:migrate`: apply migrations (uses `DATABASE_URL` from `.env.local`)

## Layout
```
src/app/          routes (App Router). Server components by default.
src/db/schema.ts  Drizzle schema (the only place tables are defined)
src/db/index.ts   db client
src/lib/          pure logic: money, periods, budgets, insights (unit-tested)
src/components/   UI components (shadcn/ui lives in src/components/ui)
e2e/              Playwright tests
docs/             RAD + feature list
drizzle/          generated migrations (never hand-edit)
```

## Non-negotiable rules
1. **Money is integer paise** (`bigint`, `amountMinor`). Use `toPaise` / `formatINR` from `src/lib/money.ts`. Never do arithmetic on rupee floats.
2. **Dates are IST** (`Asia/Kolkata`). `occurredOn` is a `"YYYY-MM-DD"` date string, not a timestamp. Period boundaries are computed in IST. Financial year = 1 Apr – 31 Mar.
3. **Ownership on every query and mutation.** Every read/write filters by the signed-in user's `userId`, checked on the server. Never trust an ID from the client alone.
4. **Transfers are not income or expense.** Exclude `type = 'transfer'` from totals, budgets and insights. Paying a credit card bill is a transfer.
5. **Auth on everything** except the sign-in page. Only emails in `ALLOWED_EMAILS` may sign in.
6. **Validation with Zod**, one schema shared by client and server.
7. **Schema changes only via migrations** (`db:generate` → review SQL → `db:migrate`). Never edit files in `drizzle/`.
8. **No secrets in code.** Use env vars; update `.env.example` when adding one.
9. **No paid APIs or third-party analytics.** Insights are rule-based (`src/lib/insights/`).
10. **Business logic lives in `src/lib/` as pure functions** with unit tests; route handlers and server actions stay thin.

## How to work on a feature
1. Read the feature in `docs/FEATURES.md` and the FR-IDs it references in `docs/RAD.md`.
2. Explain the plan: files to add or change, schema changes, tests. Wait for approval if anything is ambiguous.
3. Implement in small steps. Write tests for the logic first.
4. Run `npm run check` (and `npm run test:e2e` when UI flows change). Fix failures; never skip or delete tests to go green.
5. Tick the feature's acceptance-criteria boxes and update its Status in FEATURES.md.
6. Suggest a commit message (Conventional Commits, e.g. `feat(txn): add transaction form (F-TXN-01)`).

## Style
- Server components by default; `"use client"` only where interactivity needs it.
- Prefer server actions for mutations.
- Mobile-first UI; the add-transaction flow must be fast on a phone.
- Format currency with Indian grouping (`₹1,23,456.00`) everywhere.
- Keep components small; no premature abstraction.
