# Plan

Working plan for the exercise. Decisions here are the current defaults; if one changes, update this file in the same PR and say why in the PR description.

## The brief, condensed

Sellervate runs customer support for ecommerce brands, writing as the brand. One specialist covers 2–3 brands a day, and each brand defines a good reply differently: the scooter brand wants a diagnosis before any return is offered, the packaging brand wants three exact lines. Today a team lead skims yesterday's replies in the inbox and pings people on Slack. Nothing is recorded, so there is no coaching, no evidence for the client and late detection (one specialist closed tickets without checking order history for a month; the brand found out first).

We build an internal tool where a **team lead records their judgement on replies that already went out**, and the **specialist reads it back**. It is not a helpdesk, not an inbox, not an AI product. No automatic scoring.

Hard constraints from the brief:
- 6 hours of real work, hard stop, logged in `docs/TIMELOG.md`.
- Next.js App Router + TypeScript, Supabase Postgres (not swappable), Tailwind. Public GitHub monorepo.
- Login may be stubbed (user switcher). **Authorisation may not**: enforced on the server; a specialist asking the API for another brand's data gets a refusal.
- Invented seed data: ≥2 brands, ≥3 specialists, ≥2 leads, enough scored rows for averages to mean something. Realistic replies, brands that clearly sound different, at least one obviously bad reply.
- Design matters: chosen type scale, explainable colour system, designed empty/loading/error states.
- Deliverables: README (clone to running in <10 min, seed, how to switch role, real hours), `docs/DECISIONS.md` (≤2 pages: Product, Architecture, AI, Status), unsquashed PR history with written reviews.
- Future: replies will be imported from the helpdesk. Not now, but do not make it impossible.

Scoring weights: how you worked (PRs and reviews) 24 · problem interpretation 18 · architecture/code 13 · data model 12 · security/tenant isolation 10 · UI craft 10 · DECISIONS.md 8 · ground covered 5.

## Product reading

**Reviewing problem** as the core: queue of yesterday's replies, score, issue tags, comment, fast and consistent. The specialist's "My feedback" view closes the loop.
- **Proof**, minimal: a brand page with the weekly average, top issues by severity and a per-specialist table.
- **Coaching**, left out: only an `is_exemplar` flag on reviews, so the library is a later query.

Cut: real login, helpdesk import, AI scoring, lead calibration, notifications, exports, specialist replies to reviews.

Assumptions (restate them in DECISIONS.md):
- One review per reply per reviewer.
- Response time is computed (`sent_at − received_at`), not judged.
- The issue catalogue is global, with a severity per issue; brands do not customise it in V1.
- A specialist sees only their own reviewed replies, across all their brands.
- A lead sees everything in the brands they lead, and nothing else.

### Issue severity

Severity measures damage to the client relationship.
- critical: wrong product/policy info, didn't check order history, skipped a mandatory brand procedure
- major: answered a different question, correct but the customer will write again
- minor: tone off for the brand, length wrong for the brand, slow

Severity is used to sort, highlight and report. It **never computes the score**: the score is the lead's judgement. An optional sanity rule is that a review with a critical issue scores ≤ 2.

## Roles and visibility

The tenant is the brand. The role is per brand (`brand_memberships.role` = `lead` | `specialist`), never global.

| Action | Lead of brand | Specialist in brand | Anyone else |
|---|---|---|---|
| See the brand's replies | all | own only | 403 |
| Review a reply | yes | no | no |
| See other specialists' scores | yes | no | no |
| Brand trend | whole brand | own replies only | no |

Watch for aggregates: a "team average" shown to a specialist leaks other people's scores.

## Architecture

A single Next.js app talking to Supabase directly. No separate backend: it would duplicate authorisation and cost time; it becomes reasonable when the helpdesk importer (`apps/ingest`) exists.

```
apps/web/
  app/                 routes; Server Components read, one JSON route handler for the API check
  features/<domain>/   components, actions.ts (server actions), schema.ts (zod)
  server/              import 'server-only'
    auth/session.ts    getCurrentUser(), requireLeadOf(), requireMember()
    data/*.ts          typed queries
    supabase/server.ts per-request client carrying the user's JWT
  ui/                  shared presentational components (tokens in app/globals.css)
supabase/
  migrations/          one migration per PR that changes schema
  seed.sql
```

Rules:
- Reads go in Server Components through `server/data`. The browser never talks to Supabase.
- Writes go through server actions in this order: `getCurrentUser()` → zod parse → load the target row (RLS) → `requireLeadOf(brandId)` → write.
- `brandId` comes **from the database row**, never from the request body.
- `service_role` is only used for seeding. The app always uses the user's JWT, so RLS always applies.
- Per-user pages are dynamic. No shared caching of user data.
- Aggregates are SQL views with `security_invoker = on`.
- Types are generated with `supabase gen types`.

### Authorisation (defence in depth)

1. **Postgres RLS** is the final guarantee. Helper `public.is_lead_of(brand uuid)` (security definer, `search_path = ''`). Replies are visible when `specialist_id = auth.uid() or is_lead_of(brand_id)`. Reviews can be inserted when `reviewer_id = auth.uid() and is_lead_of(brand_id)`.
2. The **server layer** checks membership explicitly, so the API answers 403 rather than an empty list.

Stubbed login: seed users are real rows in Supabase Auth with known passwords, and the user switcher signs in server-side (`@supabase/ssr` cookies). Real auth later means replacing the switcher with a login form, with no policy changes. Fallback if that gets stuck: mint a JWT server-side.

## Data model

- `profiles(id = auth.users.id, full_name)`
- `brands(id, slug unique, name, guidelines)`
- `brand_memberships(user_id, brand_id, role)`, PK (user_id, brand_id)
- `replies(id, brand_id, specialist_id, source, external_id, subject, customer_message, reply_body, received_at, sent_at)` with `unique(source, external_id)` for future helpdesk upserts, `unique(id, brand_id)` as the target of the composite FK, and indexes `(brand_id, sent_at)` and `(specialist_id)`
- `reviews(id, reply_id, brand_id, reviewer_id, score 1–5, comment, is_exemplar, created_at)`: composite FK `(reply_id, brand_id) → replies(id, brand_id)`, `unique(reply_id, reviewer_id)`
- `issue_types(code PK, label, severity, active)`: a table, not a Postgres enum; retire issues with `active = false`
- `review_issues(review_id, issue_code)`
- Optional: `brand_events(brand_id, happened_on, note)` to annotate "what we changed" on the trend

The trend groups by `date_trunc('week', replies.sent_at)`, not by review date. Weeks with no reviews are gaps, not zero. Show the sample size and fade points where n < 3. Keep the y axis fixed at 1–5.

## Seed

Brands: **Voltra** (e-scooters, diagnose first, friendly) and **Boxwell** (B2B packaging, three exact lines, dry). **Hebra** (yarn shop) has few rows and exists to prove isolation between leads.

People:
- Marta: lead of Voltra and Boxwell
- Nuria: lead of Hebra
- Dani: specialist in Voltra and Boxwell; has the obviously bad reply (return offered without a diagnosis)
- Leo: specialist in Voltra and Hebra; the good diagnostic example
- Sara: specialist in Boxwell and Hebra; closed tickets without checking order history

About 45 replies over 6 weeks, about 30 reviewed. Dates are relative to `now()` so "yesterday" always has data. Voltra visibly improves after a change.

## PR plan

| # | Branch | Scope | Budget |
|---|---|---|---|
| 1 | `chore/scaffold` | workspace, Next app, Supabase config, tokens, shell, README | 30 min |
| 2 | `feat/schema-seed` | migrations, FKs, indexes, seed | 50 min |
| 3 | `feat/authz` | seed auth users, switcher, RLS, `requireMembership`, per-request client, 403 API route | 50 min |
| 4 | `feat/review-queue` | lead queue, reply detail with brand guidelines, review form, keyboard shortcuts | 60 min |
| 5 | `feat/my-feedback` | specialist view | 30 min |
| 6 | `feat/brand-overview` | weekly trend, top issues, per-specialist table | 45 min |
| 7 | `feat/states-polish` | designed loading/error/empty/not-found | 25 min |
| — | docs | DECISIONS.md, README final, time log | 45 min |

If time runs short, cut in this order: `brand_events`, keyboard shortcuts, per-specialist table on the brand page.

## Review checklist (for each PR)

- **Tenant leaks**
  - `service_role` used in user paths
  - a new table without RLS
  - a policy `using (true)`
  - brand or user id taken from the client
  - filtering in components instead of queries
  - aggregates that include other specialists
  - cached pages shared across users
- **Future migrations**
  - Postgres enums for categories
  - a global role column
  - a missing or non-unique `external_id`
  - hard deletes of referenced rows
  - seed data inside migrations
  - FKs without indexes
- **Not worth arguing about**: naming, small Tailwind duplication, missing tests (one line in DECISIONS.md).

## Where a model would fit (for DECISIONS.md only, do not build)

Triage, meaning which 5 replies to read: flag risky ones, for example a Voltra return offered with no diagnostic steps, or no order reference. The precondition is hundreds of human reviews to measure agreement with the lead's picks. It never assigns scores.
