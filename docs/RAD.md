# Requirements Analysis Document (RAD)
## Personal Finance Tracker — Expenses & Income (v1), Investments (future)

| Field | Value |
|---|---|
| Owner | Babu Duraiswamy |
| Version | 1.0 |
| Date | 2026-11-06 |
| Status | Approved for build |
| Companion doc | `FEATURES.md` (feature list, acceptance criteria, build order) |

---

## 1. Introduction

### 1.1 Purpose
This document defines the requirements for a personal, web-based finance tracker. It records income and expenses, produces reports for any period, tracks flexible budgets, and gives specific, data-backed suggestions to spend less and save more. It is also a learning project: the app will be built end to end with AI assistance (Claude Code).

### 1.2 Scope
**In scope (v1)**
- Google sign-in, restricted to a single allowed email
- Recording income and expense transactions with category, payment mode, date and note
- Category management (expense and income), with Need/Want tagging for expense categories
- Reports for any period: month, quarter, financial year, calendar year, custom range
- Budgets for any period and any category (or total spend)
- Rule-based spending insights and frugality tips
- Mobile-friendly UI, deployed on the internet

**Out of scope (v1)**
- Bank / SMS / UPI auto-import
- Receipt photos and OCR
- Multiple users or shared/household budgets
- Multi-currency (INR only)
- Paid AI services of any kind
- Investments (the data model is designed to support them; see §7)

### 1.3 Objectives & success criteria
| ID | Objective | Measure of success |
|---|---|---|
| OBJ-1 | Logging is effortless | A transaction can be entered on a phone in ≤ 10 seconds |
| OBJ-2 | Know where the money goes | Any period's income, spend, savings and category split visible in ≤ 2 clicks |
| OBJ-3 | Actionable frugality advice | Each report shows 3–5 tips, each tied to real numbers with a ₹ impact |
| OBJ-4 | Future-proof | Investments can be added without restructuring existing tables |
| OBJ-5 | Learning | Every feature built as a thin vertical slice (DB → API → UI → deployed) |

### 1.4 Definitions
| Term | Meaning |
|---|---|
| Transaction | Any money movement: expense, income, or transfer (later: buy, sell, dividend) |
| Payment mode | How money was paid/received: cash, UPI, debit card, credit card, net banking, wallet, cheque |
| Account | Where money sits: cash, bank account, credit card, wallet (later: brokerage, mutual fund) |
| Period | A date range: month, quarter, FY (1 Apr–31 Mar), calendar year, or custom |
| Need / Want | Classification on expense categories, used for the needs-vs-wants insight |
| Minor units | Money stored as integer paise (₹249.50 → 24950) |
| Savings rate | (income − expenses) ÷ income for a period |

---

## 2. Current system
None. Spending is currently not tracked in a structured way. There is no data to migrate.

---

## 3. Stakeholders & users
| Role | Description |
|---|---|
| Owner / sole user | Babu: enters transactions, views reports, sets budgets. The only person allowed to sign in. |

---

## 4. Functional requirements

Priority: **M** = must have (v1), **S** = should have (v1 if time allows), **L** = later.

### 4.1 Authentication (AUTH)
| ID | Requirement | Priority |
|---|---|---|
| FR-AUTH-1 | The system shall allow sign-in with Google OAuth. | M |
| FR-AUTH-2 | The system shall allow only email addresses on a configured allowlist (env var) to sign in; all others see an "access denied" page. | M |
| FR-AUTH-3 | The system shall protect every page and API route; unauthenticated requests are redirected to sign-in (pages) or receive 401 (API). | M |
| FR-AUTH-4 | The system shall create the user record on first successful sign-in and seed default categories. | M |
| FR-AUTH-5 | The user shall be able to sign out. | M |

### 4.2 Transactions (TXN)
| ID | Requirement | Priority |
|---|---|---|
| FR-TXN-1 | The user shall be able to add a transaction with: type (expense/income), amount (₹), category, date, payment mode, optional account, optional note. | M |
| FR-TXN-2 | Date shall default to today (IST); payment mode shall default to the last one used. | M |
| FR-TXN-3 | Amount shall be > 0 and stored as integer paise. Category shall match the transaction type. | M |
| FR-TXN-4 | The user shall be able to edit any field of an existing transaction. | M |
| FR-TXN-5 | The user shall be able to delete a transaction after confirmation. | M |
| FR-TXN-6 | The user shall be able to list transactions newest first, filtered by period, type, category, payment mode and text in note. | M |
| FR-TXN-7 | The list shall show totals for income, expense and net for the filtered set. | M |
| FR-TXN-8 | The user shall be able to record a transfer between accounts (e.g. paying a credit card bill); transfers are excluded from income/expense totals. | S |
| FR-TXN-9 | The user shall be able to export the filtered list to CSV. | S |
| FR-TXN-10 | The user shall be able to duplicate a past transaction for quick re-entry. | S |

### 4.3 Categories (CAT)
| ID | Requirement | Priority |
|---|---|---|
| FR-CAT-1 | The system shall seed default categories. **Expense:** Food & dining, Groceries, Transport, Rent, Utilities, Shopping, Entertainment, Health, Subscriptions, Travel, Education, Personal care, Gifts, Other. **Income:** Salary, Freelance, Interest, Refunds, Gifts received, Other income. | M |
| FR-CAT-2 | The user shall be able to add and rename categories. | M |
| FR-CAT-3 | Each expense category shall be tagged Need or Want (editable). | M |
| FR-CAT-4 | The user shall be able to archive a category; archived categories are hidden from entry but kept in history and reports. | M |
| FR-CAT-5 | The user shall be able to set a colour/icon per category. | L |
| FR-CAT-6 | The system shall support sub-categories (parent/child). | L |

### 4.4 Payment modes & accounts (PAY)
| ID | Requirement | Priority |
|---|---|---|
| FR-PAY-1 | Every transaction shall record a payment mode: cash, UPI, debit card, credit card, net banking, wallet, cheque. | M |
| FR-PAY-2 | The user shall be able to create named accounts (e.g. "HDFC Savings", "ICICI Credit Card") of type cash, bank account, credit card or wallet. | S |
| FR-PAY-3 | Reports shall be filterable and splittable by payment mode (and account, when used). | M |

### 4.5 Reports (RPT)
| ID | Requirement | Priority |
|---|---|---|
| FR-RPT-1 | The user shall be able to select a period: month, quarter, financial year (Apr–Mar), calendar year, or custom date range. Default: current month. | M |
| FR-RPT-2 | The report shall show total income, total expense, net savings and savings rate. | M |
| FR-RPT-3 | The report shall show expense by category (chart + table with ₹ and % share). | M |
| FR-RPT-4 | The report shall compare each figure with the previous period of the same length (₹ and % change). | M |
| FR-RPT-5 | Quarter, year and custom (> 1 month) views shall show a month-by-month trend chart of income vs expense. | M |
| FR-RPT-6 | The report shall show the top 5 largest expenses in the period. | M |
| FR-RPT-7 | The report shall show the split by payment mode. | M |
| FR-RPT-8 | The report shall show Needs vs Wants split. | M |
| FR-RPT-9 | Clicking a category or payment mode in a report shall open the filtered transaction list. | S |
| FR-RPT-10 | The dashboard (home) shall show current-month totals, budget status, and the top 3 tips. | M |

### 4.6 Budgets (BUD)
Budgets are not restricted to a single period type or scope.

| ID | Requirement | Priority |
|---|---|---|
| FR-BUD-1 | The user shall be able to create a budget with: amount, scope (one category, several categories, or total spend), and period type (weekly, monthly, quarterly, yearly, or custom start–end dates). | M |
| FR-BUD-2 | Weekly/monthly/quarterly/yearly budgets shall recur automatically each period until ended; custom budgets apply once. | M |
| FR-BUD-3 | The user shall be able to have multiple budgets at the same time, including overlapping ones (e.g. a monthly Food budget and a yearly Travel budget). | M |
| FR-BUD-4 | The system shall show, for each active budget: spent, remaining, % used, and days left in the period. | M |
| FR-BUD-5 | The system shall flag budgets at ≥ 80% (warning) and ≥ 100% (over). | M |
| FR-BUD-6 | The system shall project end-of-period spend from the current pace and flag budgets likely to be exceeded. | S |
| FR-BUD-7 | The user shall be able to edit, pause or end a budget; past periods keep their history. | M |
| FR-BUD-8 | The user shall be able to view budget-vs-actual history for past periods. | S |
| FR-BUD-9 | Optional rollover: unused amount carries into the next period. | L |

### 4.7 Insights & frugality tips (INS)
All insights are rule-based and computed from the user's own data. No paid AI services.

| ID | Requirement | Priority |
|---|---|---|
| FR-INS-1 | **Biggest movers:** categories with the largest increase vs the previous period and vs the trailing 3-period average. | M |
| FR-INS-2 | **Share of wallet:** categories taking the highest % of spend. | M |
| FR-INS-3 | **Needs vs wants:** compare the split with a 50/30/20 guideline (needs / wants / savings as % of income). | M |
| FR-INS-4 | **Small leaks:** categories with many small transactions; show count, total and annualised cost. | M |
| FR-INS-5 | **Recurring charges:** detect transactions with similar amount and note recurring ~monthly; list them for review as likely subscriptions. | S |
| FR-INS-6 | **Savings rate trend:** month-by-month savings rate and direction. | M |
| FR-INS-7 | **Budget risk:** budgets over, near, or projected to exceed their limit. | M |
| FR-INS-8 | **Weekday vs weekend** spend pattern. | S |
| FR-INS-9 | **Payment-mode pattern:** e.g. share of spend on credit card, rising cash use. | S |
| FR-INS-10 | Each insight shall produce a tip from a template with real numbers and a ₹ impact (e.g. "Food delivery: ₹6,400 across 18 orders. Capping at 2/week saves ≈ ₹45,000/year."). | M |
| FR-INS-11 | Tips shall be ranked by estimated ₹ impact; the top 3–5 shown per report. | M |
| FR-INS-12 | Insights shall be suppressed when there isn't enough data (e.g. < 2 periods for trends) instead of showing misleading advice. | M |
| FR-INS-13 | The user shall be able to dismiss a tip for the current period. | S |

### 4.8 Settings (SET)
| ID | Requirement | Priority |
|---|---|---|
| FR-SET-1 | The user shall be able to manage categories, accounts and budgets from a settings area. | M |
| FR-SET-2 | The user shall be able to export all data as CSV/JSON. | S |
| FR-SET-3 | The user shall be able to set a default payment mode. | S |

---

## 5. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-1 | Usability | Mobile-first, responsive layout; add-transaction reachable in one tap from any page. |
| NFR-2 | Performance | Pages load in < 2 s on 4G; report queries return in < 500 ms for 5 years of data (~20k transactions). |
| NFR-3 | Security | Auth on every route; server-side checks that every row belongs to the signed-in user; no secrets in the repo; HTTPS only. |
| NFR-4 | Privacy | Data stays in the user's own Neon database; no third-party analytics or AI services receive financial data. |
| NFR-5 | Correctness | Money stored as integer paise; no floating-point arithmetic on money; all date logic in IST (Asia/Kolkata). |
| NFR-6 | Reliability | Neon point-in-time restore available; CSV/JSON export as a manual backup. |
| NFR-7 | Maintainability | TypeScript strict mode; lint + format enforced; schema changes only via migrations. |
| NFR-8 | Testability | Unit tests for money math, period calculation, budget logic and every insight rule; e2e test for sign-in → add → report. |
| NFR-9 | Accessibility | WCAG 2.1 AA basics: labels on inputs, keyboard navigation, sufficient contrast. |
| NFR-10 | Cost | Runs on free tiers (Vercel Hobby, Neon Free). No paid APIs. |
| NFR-11 | Localisation | INR formatting with Indian digit grouping (₹1,23,456.00); dates as DD MMM YYYY. |

---

## 6. System models

### 6.1 Use cases
| ID | Use case | Primary flow |
|---|---|---|
| UC-1 | Sign in | Open app → "Sign in with Google" → allowlist check → dashboard |
| UC-2 | Log an expense | Tap "+" → choose Expense → amount → category → (payment mode prefilled) → Save |
| UC-3 | Log income | Tap "+" → choose Income → amount → category → Save |
| UC-4 | Fix an entry | Transactions → tap entry → edit → Save (or Delete → confirm) |
| UC-5 | Review a period | Reports → choose period → view totals, charts, comparisons, tips |
| UC-6 | Set a budget | Budgets → New → amount, scope, period type → Save |
| UC-7 | Check budget status | Dashboard or Budgets → see progress, warnings, projections |
| UC-8 | Act on a tip | Report → tip → tap to see the underlying transactions |
| UC-9 | Export data | Settings → Export → CSV/JSON |

### 6.2 Screens
| Screen | Contents |
|---|---|
| Sign-in | Google button; access-denied state |
| Dashboard | Current-month income / expense / net, budget progress cards, top 3 tips, recent transactions, "+" button |
| Add / Edit transaction | Type toggle, amount, category picker, date, payment mode, account, note |
| Transactions | Filterable list with totals; tap to edit |
| Reports | Period picker, KPI cards, category chart + table, trend chart, payment-mode split, needs vs wants, top expenses, tips |
| Budgets | Active budgets with progress; create/edit; history |
| Settings | Categories, accounts, default payment mode, export, sign out |

### 6.3 Data model (logical)

All tables include `user_id` and timestamps (`created_at`, `updated_at`). Money columns are `bigint` paise.

**users**: `id`, `email` (unique), `name`, `image`

**accounts**: `id`, `user_id`, `name`, `type` (`cash` | `bank_account` | `credit_card` | `wallet` | *later* `brokerage` | `mutual_fund` | `demat`), `currency` (default `INR`), `is_active`

**categories**: `id`, `user_id`, `name`, `kind` (`expense` | `income`), `need_or_want` (nullable; expense only), `parent_id` (nullable), `is_archived`, `sort_order`

**transactions**
- `id`, `user_id`
- `type` (`expense` | `income` | `transfer` | *later* `buy` | `sell` | `dividend` | `interest`)
- `amount_minor` (bigint, > 0), `currency` (default `INR`)
- `occurred_on` (date, IST)
- `category_id` (nullable for transfers)
- `payment_mode` (`cash` | `upi` | `debit_card` | `credit_card` | `net_banking` | `wallet` | `cheque`)
- `account_id` (nullable), `to_account_id` (nullable; transfers only)
- `note` (text, nullable)
- *later, nullable:* `instrument_id`, `quantity`, `unit_price_minor`, `fees_minor`
- Indexes: (`user_id`, `occurred_on`), (`user_id`, `category_id`, `occurred_on`)

**budgets**
- `id`, `user_id`, `name`, `amount_minor`
- `scope` (`total` | `categories`)
- `period_type` (`weekly` | `monthly` | `quarterly` | `yearly` | `custom`)
- `start_date`, `end_date` (nullable = recurring indefinitely; required for `custom`)
- `rollover` (bool, default false), `is_active`

**budget_categories**: `budget_id`, `category_id` (many-to-many for multi-category budgets)

**dismissed_tips** (S): `id`, `user_id`, `tip_key`, `period_start`, `period_end`

**Data rules**
1. Paying a credit-card bill is a `transfer`, not an expense (the spend was counted at swipe time).
2. Transfers are excluded from income/expense totals and insights.
3. Archived categories remain valid on historical transactions.
4. Period boundaries are computed in IST. FY = 1 Apr – 31 Mar; quarters follow the calendar (Jan–Mar, …) in calendar-year view and FY quarters (Apr–Jun = Q1) in FY view.
5. Budget spend for a period is computed live from transactions, not stored.

### 6.4 Architecture
| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript strict |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Validation | Zod (shared between client and server) |
| Auth | Auth.js (NextAuth) with Google provider + email allowlist |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Database | Neon serverless Postgres (separate `dev` and `main` branches) |
| Hosting | Vercel (Neon is the database only; Vercel hosts the app) |
| Testing | Vitest (unit), Playwright (e2e) |
| CI | GitHub Actions: lint, type-check, test on every PR; Vercel preview deploys |

**Request flow:** Browser → Next.js on Vercel (auth middleware) → server actions / route handlers → Drizzle → Neon.

**Environment variables:** `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_EMAILS`.

---

## 7. Future: investment tracker
The v1 model is a ledger (accounts + typed transactions), so investments extend it rather than replace it.

| Step | Addition |
|---|---|
| 1 | New account types (`brokerage`, `mutual_fund`, `demat`) and an `instruments` table (symbol, name, asset class: stock, MF, ETF, FD, gold, bond, crypto) |
| 2 | `buy` / `sell` / `dividend` transactions using `instrument_id`, `quantity`, `unit_price_minor`, `fees_minor` |
| 3 | `prices` table (instrument_id, date, close) and a holdings view computed from transactions + prices |
| 4 | Net-worth view: cash + bank + investments − credit-card dues, over time |
| 5 | Returns: XIRR per holding and portfolio; asset-allocation chart |
| 6 | Link savings rate to investing ("₹X saved this month; ₹Y invested") |
| 7 | Import broker / CAS statements (CSV) |

---

## 8. Constraints & assumptions
**Constraints**
- Single user; free-tier infrastructure only; no paid APIs.
- INR only.

**Assumptions**
- The user has a Google account and GitHub, Vercel and Neon accounts.
- Data volume stays under ~5k transactions/year.
- All entry is manual in v1.

---

## 9. Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Timezone bugs put late-night entries in the wrong day/month | Wrong reports | Store `occurred_on` as a date; compute periods in IST; unit tests at boundaries |
| Floating-point money errors | Wrong totals | Integer paise everywhere; format only at display |
| Double-counting credit-card spend | Inflated expenses | Card bill payment modelled as transfer (Data rule 1) |
| Misleading tips from too little data | Bad advice | Minimum-data thresholds (FR-INS-12) |
| Scope creep before v1 ships | Never finishes | Strict M/S/L priorities; ship M first |

---

## 10. Traceability
Each functional requirement maps to a feature in `FEATURES.md` (e.g. FR-TXN-1 → F-TXN-01). Acceptance criteria live in `FEATURES.md`.
