# Sellervate QA: agent instructions

Take-home exercise for Sellervate (Product Engineer). An internal tool where team leads review support replies that already went out and specialists read the feedback on their own work. Full plan, decisions and PR sequence: @docs/PLAN.md

## Working agreement

- **Talk to the user in Spanish.** Code, commits, PRs, README and DECISIONS.md are in English.
- **One branch and one small PR per piece of work** (readable in ~5 minutes), following the PR plan in `docs/PLAN.md`. Branch from an up-to-date `main`.
- Claude writes the code, commits and opens the PR with `gh pr create`. **The user writes the review on GitHub. Never post review comments, approve or merge on the user's behalf.** After the review, address comments with new commits on the same branch.
- **No squash, no rebase, no force-push, no amending pushed commits.** The repo only allows merge commits. The history is graded.
- Commits: conventional prefix (`feat`, `fix`, `chore`, `docs`), a body that explains why, and a `Co-Authored-By` trailer.
- PR description sections: What, Checks (what was actually run, and what was **not** verified), Out of scope.
- Before opening a PR, run `pnpm typecheck`, `pnpm lint` and `pnpm build` from the repo root, and look at the page in the browser if UI changed.
- After opening a PR, list for the user (in Spanish) the points worth commenting on in their review, including honest weaknesses of the PR.
- **Time cap: 6 h total.** Remind the user to log real minutes per PR in `docs/TIMELOG.md`. Do not gold-plate; cut scope using the cut order in the plan.
- Session transcripts go to `ai-logs/NN-<topic>.md` + `.jsonl`, with the user's email replaced by `<redacted>`.

## Non-negotiables

- Authorisation is enforced on the server: Postgres RLS plus explicit checks in `server/auth`. Hiding UI is not authorisation.
- Never use the `service_role` key in app code paths; only for seeding.
- Take `brand_id` from the database row, never from request input.
- Every new table gets RLS in the same migration.
- No AI or automatic scoring features. Ideas about models go in DECISIONS.md as a paragraph.
- Seed data is realistic (no lorem ipsum); brands must sound different.

## Stack and commands

pnpm 11 workspace. `apps/web` is Next.js 16 App Router + TypeScript + Tailwind v4. `supabase/` holds the local Supabase config, migrations and seed. The Supabase CLI is a root devDependency, so use `pnpm exec supabase …`.

```bash
pnpm dev          # Next dev server on :3000
pnpm typecheck    # next typegen && tsc --noEmit (LayoutProps/PageProps are generated types)
pnpm lint
pnpm build
pnpm db:start     # local Supabase (Docker must be running)
pnpm db:reset     # re-apply migrations + seed
pnpm db:status    # prints local URL and keys
```

- Next.js 16 differs from older versions: read `apps/web/node_modules/next/dist/docs/` before using an unfamiliar API (see `apps/web/AGENTS.md`).
- Design tokens (colours, type scale, fonts) live in `apps/web/app/globals.css`. Use the token classes (`bg-surface`, `text-ink-muted`, `border-line`, `text-bad`…), never raw hex values.
- Env: `apps/web/.env.local` (copied from `.env.example`). Never commit secrets.

## Current status

Update this list when a PR merges.

- [ ] PR1 `chore/scaffold` (open: https://github.com/fernando59/sellervate-exercise/pull/1)
- [ ] PR2 `feat/schema-seed`
- [ ] PR3 `feat/authz`
- [ ] PR4 `feat/review-queue`
- [ ] PR5 `feat/my-feedback`
- [ ] PR6 `feat/brand-overview`
- [ ] PR7 `feat/states-polish`
- [ ] DECISIONS.md, final README, time log
