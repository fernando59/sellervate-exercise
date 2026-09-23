# Sellervate QA

Internal tool where team leads review support replies that already went out, and specialists read the feedback on their own work.

## Run it locally

Requirements: Node ≥ 20.9, pnpm 11 (`corepack enable`), Docker running.

```bash
pnpm install
pnpm bootstrap     # starts local Supabase in Docker, applies migrations + seed, writes apps/web/.env.local
pnpm dev           # http://localhost:3000
```

The first `pnpm bootstrap` pulls the Supabase images and takes a few minutes; later runs take seconds. `pnpm db:reset` re-applies migrations and the seed at any time. `apps/web/.env.local` is only written if it does not exist, and only ever gets the anon key.

### Seed data

Three brands that read very differently: **Voltra** (e-scooters, diagnose before offering a return), **Boxwell** (B2B packaging, three exact lines) and **Hebra** (a yarn shop). 45 replies over the last six weeks, 32 of them reviewed. Most of yesterday's replies are unreviewed, so the queue has work.

| Person | Email | Role |
|---|---|---|
| Marta Ruiz | marta@sellervate.test | Lead: Voltra, Boxwell |
| Nuria Vidal | nuria@sellervate.test | Lead: Hebra |
| Dani Ortega | dani@sellervate.test | Specialist: Voltra, Boxwell |
| Leo Marín | leo@sellervate.test | Specialist: Voltra, Hebra |
| Sara Campos | sara@sellervate.test | Specialist: Boxwell, Hebra |

Password for everyone: `password123` (local demo data only). Role switching and the authorization check land in the next pull request.

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
