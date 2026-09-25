# Decisions

## Product

**The real problem.** Leads' judgement of replies that already went out leaves no record. Without one there is no coaching, no answer when a brand asks "are you improving?", and mistakes surface when the brand finds them. Of the three readings in the brief I built **review** properly, **proof** in its minimal form, and left **coaching** out: the trend and an examples library are both queries over stored reviews, so the review comes first.

**Built first:** the lead's queue for yesterday's replies (`/review`), with the brand's main rule next to the reply, a 1–5 score, issue tags grouped by severity, a comment and "Save and next" (`1`–`5`, `J`/`K`). Then the specialist's feedback (`/me`), the reply detail and the brand page with the weekly trend.

**Two rules that make the data useful later.** "What went wrong" is **tags from a global catalog**, not free text, because "did Dani stop offering returns without diagnosing?" means asking whether the same tag comes back. Severity lives on the tag (critical = can lose the account, major = customer writes again, minor = annoying), not on the review, so leads grade consistently. It never computes the score. It only sorts, highlights, and caps the score: with a critical tag the score is at most 2, and a score of 3 or lower needs a tag.

**Left out:** real login, helpdesk import (ready via `unique(source, external_id)`), AI scoring, calibration between leads, notifications, export, the coaching library (only an `is_exemplar` flag), specialists answering a review. Specialists see no "team average": even without names it leaks other people's scores.

**Where a model would fit:** triage, i.e. picking which 5 of ~200 replies the lead reads, by flagging risky ones (a Voltra return offered with no diagnosis, a Boxwell reply with no order number). Never scoring. Trusting it would need a few hundred human reviews to check it picks what Marta would.

**Questions before a V2:** Should rubric or severity differ per brand ("slow" may be major in Boxwell)? Who maintains each brand's rules? Does the brand see this directly or through the lead? Should two leads grade the same reply to calibrate?

## Architecture

**Shape.** One Next.js 16 app talking straight to Supabase; no separate backend. Reads happen in Server Components via `server/data`, writes in server actions, and the browser never talks to Supabase. A separate API would duplicate authorization. It earns its place with the helpdesk importer, which `apps/` leaves room for. No component library (daisyUI's themes would fight our own tokens) and no Docker files of our own (`pnpm bootstrap` wraps the Supabase CLI).

**Data model.** `brands`, `profiles`, `brand_memberships(user_id, brand_id, role)`, `replies`, `reviews`, `issue_types`, `review_issues`, `brand_events`. The role is **per brand**, so a lead of 4 brands sees nothing of the other 2. `reviews.brand_id` is denormalized with a composite FK to `replies(id, brand_id)`: RLS needs no join and a review cannot lie about its brand. Catalogs are tables or `text + check`, never enums, and issue types are retired, not deleted. Deleting a reviewed reply is restricted, not cascaded.

**Where authorization is enforced.** Postgres RLS is the final guarantee: helpers in a `private` schema, aggregate views with `security_invoker = on`, direct writes to `reviews` revoked, and one `save_review` function that re-checks lead, tags and score. On top, `server/auth` checks explicitly (`requireMember`, `requireLeadOf`), so the API answers **403** rather than an empty list. `brand_id` always comes from the row. The app never uses `service_role`.

**Real auth.** The switcher already signs in against real Supabase Auth users with httpOnly cookies. Real auth replaces it with a login form or SSO and removes `/api/demo-session`. No policy changes.

**What breaks first as it grows.** (1) Aggregates are computed live over each brand's whole history, so they need a weekly rollup. (2) "Yesterday" and week boundaries hard-code `Europe/Madrid`; they should use `brands.time_zone`. (3) One 1–5 score cannot hold per-brand criteria, so they need a versioned rubric. (4) Search uses `ilike` and paging uses `offset`; at scale they need trigram indexes and keyset paging. (5) Nothing ties `replies.specialist_id` to a membership of that brand, and the importer will write with elevated rights (TASK-009).

**Tests.** None automated. First would be the RLS policies in pgTAP (`supabase test db`), because a mistake there costs an account; left out for time. `supabase/tests/rls-matrix.sql` is a manual stand-in that runs the role matrix and the forbidden writes as each seed person.

## AI

**How I worked.** One task file per PR (`docs/tasks/`, `0-backlog` → `3-done`) with acceptance criteria and isolation risks. Before each task the agent grilled me on open decisions and wrote the answers down. The agent wrote the code, commits and PR; I reviewed on GitHub; fixes went in new commits. Before each PR, read-only subagents (`.claude/agents/`) checked the diff: `code-reviewer` and `security-reviewer` on Sonnet, `tenant-isolation-reviewer` on Opus, querying the database as each seed person. Library docs came first (Context7, Next 16's bundled docs). Transcripts are in `ai-logs/`.

**Where the agent was right.** The isolation subagent found that a lead could skip the review rules with a direct `POST /rest/v1/reviews` (score 5 plus a critical tag), and that a schema-level `revoke execute` did nothing, which would have left new `security definer` functions callable by `anon`. The agent also pushed back on my request for a Docker Compose file: the Supabase CLI already runs the stack.

**Where I corrected it.** It kept listing fixable issues as review points instead of fixing them. That became a written rule. It let a lead pick 5 and then a critical tag, failing only on save. It allowed a low score with no tag, so a repeated mistake left no record. It shipped `/me` without search or paging, which would not survive the helpdesk import. `profiles` visibility was too wide, so now two specialists never see each other. And the trend summary averaged the rounded weekly averages.

**A prompt, verbatim** (Spanish, PR #5):

> que te dije de hacer los cambios si podes hacelro, no es neceario dejarlo a proposito solo para que tenga algo que comentar. Yo eso lo voy a leer en el pr y buscar. no me dejes erroes asi o cosas sin terminar a menos que tenga que decidir yo. anotalo eso en las reglas

("Make the changes if you can; don't leave things on purpose so I have something to comment on. I'll read the PR myself. Unless I need to decide, no loose ends. Put that in the rules.")

## Status

**Done**, by priority: authorization (RLS + server checks, a 403 you can `curl`); the review queue and form; the specialist's feedback with search and paging; the reply detail; the brand page (weekly trend, frequent issues, per-specialist table, "what changed" markers); a credible seed; one-command setup.

**Partial:** empty and not-found states are designed, but a not-found page keeps the page's tab title.

**Not started:** `loading.tsx` / `error.tsx` per route (TASK-007: a failed query shows Next's default error), membership integrity (TASK-009), the coaching library, per-brand time zones, automated tests.

**What I'd criticise most in someone else's PR:** the missing loading and error states. The brief asks for them, and a slow or failed query is the first thing a user hits. At the 6-hour cap the time went to authorization and the review loop instead, where a mistake costs an account rather than a blank screen.
