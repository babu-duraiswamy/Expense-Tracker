# Finance Tracker

Personal web app to track income and expenses, report on any period, set flexible budgets and get rule-based tips to spend less. Built to learn end-to-end development with Claude Code. Designed to grow into an investment tracker later.

- Requirements: [`docs/RAD.md`](docs/RAD.md)
- Features & build order: [`docs/FEATURES.md`](docs/FEATURES.md)
- Rules for Claude Code: [`CLAUDE.md`](CLAUDE.md)

## What's in this skeleton

| Included | Path |
|---|---|
| Next.js + TypeScript (strict) + Tailwind v4 config | `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` |
| Lint, format, unit and e2e test setup | `eslint.config.mjs`, `.prettierrc`, `vitest.config.ts`, `playwright.config.ts` |
| Full v1 database schema (Drizzle) | `src/db/schema.ts` |
| Money helpers + tests (paise, ₹ formatting) | `src/lib/money.ts`, `src/lib/money.test.ts` |
| Payment modes & default categories | `src/lib/constants.ts` |
| Placeholder home page + smoke e2e test | `src/app/`, `e2e/smoke.spec.ts` |
| CI (lint, format, typecheck, tests) | `.github/workflows/ci.yml` |
| Claude Code commands | `.claude/commands/` |

Auth, screens, reports, budgets and insights are **not** built. That's the work you do with Claude Code, one feature at a time.

## 1. One-time setup (≈ 30 min)

You need: Node 20.9+ (22 recommended), Git, and free accounts on GitHub, Vercel, Neon and Google Cloud.

```bash
npm install
npx playwright install chromium
cp .env.example .env.local
npm run check          # lint + typecheck + unit tests should pass
npm run dev            # open http://localhost:3000
```

**Neon:** create a project → create a `dev` branch → copy its connection string into `DATABASE_URL` in `.env.local`. Then:
```bash
npm run db:generate    # creates the first migration in drizzle/
npm run db:migrate     # applies it to your dev branch
```

**Google OAuth** (needed for F-AUTH-01): Google Cloud Console → APIs & Services → OAuth consent screen (External, add yourself as a test user) → Credentials → OAuth client ID (Web). Add the redirect URIs listed in `.env.example`. Put the ID and secret in `.env.local`, plus `AUTH_SECRET` (`npx auth secret`) and your email in `ALLOWED_EMAILS`.

**GitHub + Vercel:** push the repo to GitHub → import it in Vercel → add the same env vars in Vercel (use the Neon `main` branch URL for production) → deploy.

## 2. Build with Claude Code

Open the folder in Claude Code and use the built-in commands:

| Command | What it does |
|---|---|
| `/status` | Progress and the next feature to build |
| `/feature F-AUTH-01` | Plans the feature, waits for your OK, builds it, tests it, ticks it off |
| `/review` | Strict review of your uncommitted changes against the project rules |
| `/explain src/db/schema.ts` | Learner-friendly walkthrough of a file or concept |

**Suggested first prompt:**
> Run `npm install` and `npm run check`. If any package versions in package.json don't resolve or have breaking changes, update them to the current stable versions and fix what breaks. Then run `/status`.

Then follow the build order: `F-AUTH-01 → F-CAT-01 → F-TXN-01 → …`. Commit after each feature.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run check` | Lint + typecheck + unit tests |
| `npm test` / `npm run test:watch` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run db:generate` / `db:migrate` / `db:studio` | Drizzle migrations and DB browser |
| `npm run format` | Prettier |
