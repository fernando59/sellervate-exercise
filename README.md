# Sellervate QA

Internal tool where team leads review support replies that already went out, and specialists read the feedback on their own work.

## Run it locally

Requirements: Node ≥ 20.9, pnpm 11 (`corepack enable`), Docker running.

```bash
pnpm install
pnpm db:start                     # local Supabase in Docker (first run pulls images)
cp apps/web/.env.example apps/web/.env.local
pnpm db:status                    # copy API URL and anon key into apps/web/.env.local
pnpm dev                          # http://localhost:3000
```

Seed data, role switching and the authorisation check land in the next pull requests.

## Repository layout

```
apps/web/     Next.js App Router + TypeScript + Tailwind v4
supabase/     config, migrations and seed (Supabase CLI)
docs/         DECISIONS.md, TIMELOG.md
ai-logs/      agent session transcripts
```

Started from `create-next-app` (Next.js 16, Tailwind template). No other starter kit.

## Time spent

See [`docs/TIMELOG.md`](docs/TIMELOG.md).
