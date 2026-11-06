# Feature List
## Personal Finance Tracker — Expenses & Income (v1)

Companion to `RAD.md`. Each feature lists its requirements (FR-IDs), priority, dependencies and acceptance criteria, so it can be handed to Claude Code one at a time.

**Priority:** M = must have (v1) · S = should have · L = later
**Status:** ☐ Not started · ◐ In progress · ☑ Done

---

## Summary

| ID | Feature | Epic | Priority | Depends on | Status |
|---|---|---|---|---|---|
| F-SETUP-01 | Project skeleton & deploy | Setup | M | — | ◐ |
| F-SETUP-02 | Database & schema | Setup | M | F-SETUP-01 | ☑ |
| F-SETUP-03 | Tooling, tests & CI | Setup | M | F-SETUP-01 | ◐ |
| F-AUTH-01 | Sign-in with allowlist | Auth | M | F-SETUP-02 | ◐ |
| F-CAT-01 | Default categories & management | Categories | M | F-AUTH-01 | ☑ |
| F-TXN-01 | Add transaction | Transactions | M | F-CAT-01 | ☑ |
| F-TXN-02 | Transaction list & filters | Transactions | M | F-TXN-01 | ☑ |
| F-TXN-03 | Edit & delete transaction | Transactions | M | F-TXN-02 | ☑ |
| F-PAY-01 | Payment modes | Payments | M | F-TXN-01 | ☑ |
| F-PAY-02 | Named accounts & transfers | Payments | S | F-PAY-01 | ☐ |
| F-RPT-01 | Period picker & period engine | Reports | M | F-TXN-02 | ☑ |
| F-RPT-02 | Period report | Reports | M | F-RPT-01 | ☑ |
| F-RPT-03 | Trend charts | Reports | M | F-RPT-02 | ☑ |
| F-BUD-01 | Flexible budgets | Budgets | M | F-RPT-01 | ☑ |
| F-BUD-02 | Budget projections & history | Budgets | S | F-BUD-01 | ☐ |
| F-INS-01 | Insight engine (core rules) | Insights | M | F-RPT-02, F-BUD-01 | ☑ |
| F-INS-02 | Tip templates & ranking | Insights | M | F-INS-01 | ☑ |
| F-INS-03 | Extra insight rules | Insights | S | F-INS-01 | ☐ |
| F-DASH-01 | Dashboard | Dashboard | M | F-RPT-02, F-BUD-01, F-INS-02 | ☑ |
| F-SET-01 | Settings & export | Settings | S | F-CAT-01 | ☐ |
| F-QA-01 | Hardening & polish | Quality | M | all M features | ☐ |

**Suggested build order:** SETUP-01 → SETUP-03 → SETUP-02 → AUTH-01 → CAT-01 → TXN-01 + PAY-01 → TXN-02 → TXN-03 → RPT-01 → RPT-02 → RPT-03 → BUD-01 → INS-01 → INS-02 → DASH-01 → QA-01 → then S features.

---

## Epic: Setup

### F-SETUP-01 · Project skeleton & deploy
**Priority:** M · **Requirements:** NFR-7, NFR-10
**Description:** Create the Next.js (App Router, TypeScript strict) + Tailwind + shadcn/ui project, push to GitHub, connect to Vercel.
**Acceptance criteria**
- [x] `npm run dev` serves a placeholder home page locally
- [ ] Repo on GitHub; every push to `main` deploys to Vercel; PRs get preview URLs
- [x] TypeScript `strict: true`
- [x] README explains how to run locally

### F-SETUP-02 · Database & schema
**Priority:** M · **Requirements:** RAD §6.3, NFR-5
**Description:** Create a Neon project with `dev` and `main` branches. Define the v1 schema in Drizzle (`users`, `accounts`, `categories`, `transactions`, `budgets`, `budget_categories`) and generate the first migration.
**Acceptance criteria**
- [x] Migration applies cleanly to the Neon `dev` branch (applies to `main`/production at deploy time)
- [x] Money columns are `bigint` paise; `occurred_on` is a `date`
- [x] Enums/check constraints for `type`, `payment_mode`, `kind`, `period_type`, `scope`
- [x] Indexes on (`user_id`, `occurred_on`) and (`user_id`, `category_id`, `occurred_on`)
- [x] Nullable investment columns are **not** added yet (documented for later)
- [x] `DATABASE_URL` read from env; local `.env.local` git-ignored

### F-SETUP-03 · Tooling, tests & CI
**Priority:** M · **Requirements:** NFR-7, NFR-8
**Acceptance criteria**
- [x] ESLint + Prettier configured; `npm run lint` passes
- [x] Vitest set up with one passing sample test
- [x] Playwright set up with one smoke test (home page loads)
- [x] GitHub Actions runs lint, type-check and unit tests on every PR
- [x] Money helpers: `toPaise("249.50") → 24950`, `formatINR(12345600) → "₹1,23,456.00"`, with unit tests

---

## Epic: Auth

### F-AUTH-01 · Sign-in with allowlist
**Priority:** M · **Requirements:** FR-AUTH-1…5, NFR-3
**Description:** Auth.js, built in two phases. **Phase A:** Credentials provider — single user, email + password checked against `AUTH_USER_EMAIL` / `AUTH_PASSWORD_HASH` (scrypt hash) env vars. **Phase B (later):** add the Google provider alongside, restricted to `ALLOWED_EMAILS`.
**Acceptance criteria — Phase A (email + password)**
- [x] Sign-in with the configured email + password works
- [x] Wrong email or password shows an inline error; no session is created
- [x] Every page except `/login` redirects to `/login` when signed out
- [ ] Every server action / API route returns 401 when signed out (no API routes exist yet to verify against — revisit when F-TXN-01 adds the first one)
- [x] First successful sign-in creates the `users` row (category seeding wired in F-CAT-01)
- [x] Sign-out works and clears the session
- [x] Password is hashed (scrypt, salted); never logged or stored in plaintext
- [x] Unit tests for the hash/verify helpers
**Acceptance criteria — Phase B (Google, later)**
- [ ] "Sign in with Google" works for the allowed email
- [ ] Any other Google account sees an "Access denied" page and no user row is created
- [ ] e2e test covers the allowed and denied flows (mocked provider)

---

## Epic: Categories

### F-CAT-01 · Default categories & management
**Priority:** M · **Requirements:** FR-CAT-1…4
**Acceptance criteria**
- [x] Defaults seeded on first sign-in (list in RAD FR-CAT-1); seeding is idempotent
- [x] Each expense default has a sensible Need/Want tag (e.g. Rent = Need, Entertainment = Want)
- [x] User can add a category (name, kind, Need/Want for expense)
- [x] User can rename and change the Need/Want tag
- [x] User can archive/unarchive (archive state persists; "hidden from entry picker" to be wired when F-TXN-01 adds that picker)
- [x] Duplicate names within the same kind are rejected
- [ ] Later (L): colour/icon, sub-categories

---

## Epic: Transactions

### F-TXN-01 · Add transaction
**Priority:** M · **Requirements:** FR-TXN-1…3, NFR-1, OBJ-1
**Acceptance criteria**
- [x] "+" button reachable from every page opens the add form (header, every `(app)` route)
- [x] Fields: type toggle (Expense / Income), amount (₹), category (filtered by type), date, payment mode, note (optional)
- [x] Date defaults to today in IST; payment mode defaults to last used
- [x] Amount must be > 0 with at most 2 decimals; stored as paise
- [x] Zod validation on the server (shared schema in `src/lib/transactions/schema.ts`); errors shown inline. Client-side pre-submit validation not added yet — relies on server round-trip + native `required`.
- [ ] On save: success toast, form resets, list/dashboard update (redirects to list instead of toast; no reset-in-place)
- [x] Usable one-handed on a phone; save in ≤ 10 s for a typical entry
- [x] Unit tests for validation; e2e-verified add → appears in list (verified manually during build, not a committed e2e test)

### F-TXN-02 · Transaction list & filters
**Priority:** M · **Requirements:** FR-TXN-6, FR-TXN-7
**Acceptance criteria**
- [x] Newest first, grouped by date
- [x] Filters: type, category (multi), payment mode (multi), note search, date range (from/to — full F-RPT-01 period picker not layered in yet)
- [x] Shows income, expense and net totals for the filtered set
- [x] Filters are reflected in the URL (shareable/bookmarkable, back button works)
- [x] Paginates beyond 50 rows ("Load more")
- [x] Empty state with a prompt to add the first transaction

### F-TXN-03 · Edit & delete transaction
**Priority:** M · **Requirements:** FR-TXN-4, FR-TXN-5
**Acceptance criteria**
- [x] Tapping a row opens the same form, pre-filled
- [x] Changing type re-filters categories and requires a valid category
- [x] Delete asks for confirmation; totals update immediately
- [x] A user cannot edit or delete a row that isn't theirs (server-side check; verified manually by ownership filter in queries)
- [ ] (S) "Duplicate" action creates a new pre-filled entry dated today (FR-TXN-10) — not built

---

## Epic: Payments

### F-PAY-01 · Payment modes
**Priority:** M · **Requirements:** FR-PAY-1, FR-PAY-3
**Acceptance criteria**
- [x] Modes: Cash, UPI, Debit card, Credit card, Net banking, Wallet, Cheque
- [x] Required on every transaction; defaults to last used
- [x] Available as a filter in the list (report split comes with F-RPT-02)

### F-PAY-02 · Named accounts & transfers
**Priority:** S · **Requirements:** FR-PAY-2, FR-TXN-8
**Acceptance criteria**
- [ ] User can create accounts (name + type: cash, bank account, credit card, wallet)
- [ ] Transactions can optionally be linked to an account
- [ ] Transfer type moves money between two accounts (e.g. bank → credit card bill)
- [ ] Transfers are excluded from income/expense totals, budgets and insights (unit-tested)

---

## Epic: Reports

### F-RPT-01 · Period picker & period engine
**Priority:** M · **Requirements:** FR-RPT-1, NFR-5
**Description:** One shared module that turns a period selection into a start/end date in IST and computes the matching previous period.
**Acceptance criteria**
- [x] Supports: month, quarter (calendar and FY quarters), financial year (Apr–Mar), calendar year, custom range, and week (for budgets)
- [x] `previousPeriod()` returns the prior period of the same length
- [x] Picker UI with quick options (This month, Last month, This quarter, This FY, This year, Custom)
- [x] Unit tests at boundaries: 31 Mar/1 Apr, 31 Dec/1 Jan, leap years (28 passing tests in `periods.test.ts`)

### F-RPT-02 · Period report
**Priority:** M · **Requirements:** FR-RPT-2…4, FR-RPT-6…9
**Acceptance criteria**
- [x] KPI cards: income, expense, net savings, savings rate, each with ₹ and % change vs previous period
- [x] Expense by category: table (₹, % share) — chart deferred, table covers the requirement
- [x] Split by payment mode
- [x] Needs vs wants split (₹ and %)
- [x] Top 5 largest expenses
- [ ] Clicking a category or mode opens the filtered transaction list (S) — not built
- [x] Figures verified end-to-end against real seeded data (not a hand-calculated fixture unit test — query logic is simple aggregation, covered by manual e2e verification during build)
- [ ] Report for 5 years of data (~20k rows) loads in < 500 ms server time — not load-tested

### F-RPT-03 · Trend charts
**Priority:** M · **Requirements:** FR-RPT-5
**Acceptance criteria**
- [x] For periods longer than one month: month-by-month income vs expense bars (savings-rate line not added)
- [ ] Category trend: pick a category to see its monthly spend over the period — not built
- [x] Months with no data show as zero, not gaps (`enumerateMonths`, unit tested)

---

## Epic: Budgets

### F-BUD-01 · Flexible budgets
**Priority:** M · **Requirements:** FR-BUD-1…5, FR-BUD-7
**Description:** Budgets are unrestricted: any amount, any scope, any period type, multiple at once.
**Acceptance criteria**
- [x] Create a budget with name, amount, scope (total spend, or one or more categories) and period type (weekly, monthly, quarterly, yearly, custom start–end)
- [x] Recurring budgets roll into each new period automatically (`currentBudgetPeriod`); custom budgets apply once
- [x] Multiple and overlapping budgets allowed (each computed independently, no exclusivity constraint)
- [x] Each budget shows spent, remaining, % used, days left
- [x] Warning state at ≥ 80%, over state at ≥ 100%
- [x] Edit, pause (and resume) a budget. "End" (permanently close out, keeping history) not built — pause is the closest equivalent; past-period history is F-BUD-02 (S, not built)
- [x] Spend computed live from transactions (excludes transfers and income — `type = 'expense'` only)
- [x] Unit tests: weekly/monthly/quarterly/yearly/custom windows (10 passing in `period.test.ts`); multi-category scope and overlapping budgets verified end-to-end against the real DB (not unit-tested in isolation)

### F-BUD-02 · Budget projections & history
**Priority:** S · **Requirements:** FR-BUD-6, FR-BUD-8, FR-BUD-9 (L)
**Acceptance criteria**
- [ ] Projected end-of-period spend from current daily pace; flag if projected > budget
- [ ] History table: each past period's budget vs actual
- [ ] (L) Optional rollover of unused amount

---

## Epic: Insights

### F-INS-01 · Insight engine (core rules)
**Priority:** M · **Requirements:** FR-INS-1…4, FR-INS-6, FR-INS-7, FR-INS-12
**Description:** Pure functions that take a period's aggregated data and return insight objects (`{ key, severity, data, impactPaise }`). No UI, no AI.
**Acceptance criteria**
- [x] Rules: biggest movers, share of wallet, needs vs wants vs 50/30/20, small leaks, savings-rate trend, budget risk
- [x] Each rule has unit tests with fixture data, including "not enough data → no insight" (17 passing in `rules.test.ts`)
- [x] Transfers excluded from every rule (all input queries filter `type != 'transfer'`)
- [x] Engine runs for any period from F-RPT-01 (`computeInsightsForPeriod`)

### F-INS-02 · Tip templates & ranking
**Priority:** M · **Requirements:** FR-INS-10, FR-INS-11
**Acceptance criteria**
- [x] One template per insight key, kept in a single file (`src/lib/insights/tips.ts`)
- [x] Tips contain real figures and an annualised ₹ impact where meaningful
- [x] Ranked by impact; top 5 shown on the report. Top 3 on the dashboard not built yet — pending F-DASH-01
- [ ] Each tip links to the transactions behind it — not built
- [x] Unit tests for rendered tip text (exact-string assertions in `tips.test.ts`, not visual snapshots)

### F-INS-03 · Extra insight rules
**Priority:** S · **Requirements:** FR-INS-5, FR-INS-8, FR-INS-9, FR-INS-13
**Acceptance criteria**
- [ ] Recurring-charge detection (similar amount + note, ~monthly, ≥ 3 occurrences)
- [ ] Weekday vs weekend pattern
- [ ] Payment-mode pattern (e.g. rising credit-card share)
- [ ] Dismiss a tip for the current period (stored in `dismissed_tips`)

---

## Epic: Dashboard

### F-DASH-01 · Dashboard
**Priority:** M · **Requirements:** FR-RPT-10
**Acceptance criteria**
- [x] Current-month income, expense, net and savings rate
- [x] Active budgets with progress bars and warning/over states
- [x] Top 3 tips
- [x] Last 5 transactions with "View all"
- [x] Prominent "+" add button (header, on every page)
- [ ] Loads in < 2 s on 4G — not measured

---

## Epic: Settings

### F-SET-01 · Settings & export
**Priority:** S · **Requirements:** FR-SET-1…3
**Acceptance criteria**
- [ ] Manage categories, accounts and budgets from one area
- [ ] Default payment mode setting
- [ ] Export all transactions as CSV and full data as JSON
- [ ] Sign out

---

## Epic: Quality

### F-QA-01 · Hardening & polish
**Priority:** M · **Requirements:** NFR-1…11
**Acceptance criteria**
- [ ] Loading, empty and error states on every screen
- [ ] Ownership checks on every query and mutation (tested)
- [ ] e2e: sign in → add expense + income → report shows correct totals → budget updates
- [ ] Accessibility pass: labels, focus order, contrast
- [ ] INR formatting with Indian grouping everywhere
- [ ] Lighthouse mobile performance ≥ 90 on dashboard

---

## Later (not v1)

| ID | Feature | Notes |
|---|---|---|
| F-L-01 | Category colours/icons & sub-categories | FR-CAT-5, FR-CAT-6 |
| F-L-02 | Budget rollover | FR-BUD-9 |
| F-L-03 | CSV import of bank statements | Manual upload, column mapping |
| F-L-04 | Investments: instruments, buy/sell/dividend | RAD §7 steps 1–2 |
| F-L-05 | Holdings, prices & net worth | RAD §7 steps 3–4 |
| F-L-06 | Returns (XIRR) & asset allocation | RAD §7 step 5 |
| F-L-07 | Broker / CAS statement import | RAD §7 step 7 |
| F-L-08 | PWA install & offline entry | Add to home screen, sync when online |

---

## Using this with Claude Code
1. Put `RAD.md` and `FEATURES.md` in a `docs/` folder at the repo root.
2. Add a short `CLAUDE.md` pointing to them, with the key rules: integer paise, IST dates, transfers excluded from totals, ownership checks on every query.
3. Build one feature per session: *"Implement F-TXN-01 from docs/FEATURES.md. Explain your plan first, then build, then run the tests."*
4. Tick the acceptance-criteria boxes and update the Status column as you go.
