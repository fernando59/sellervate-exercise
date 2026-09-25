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

Three brands that read very differently: **Voltra** (e-scooters, diagnose before offering a return), **Boxwell** (B2B packaging, three exact lines) and **Hebra** (a yarn shop). 55 replies over the last six weeks, 46 of them reviewed. Most of yesterday's replies are unreviewed, so the queue has work.

| Person | Email | Role |
|---|---|---|
| Marta Ruiz | marta@sellervate.test | Lead: Voltra, Boxwell |
| Nuria Vidal | nuria@sellervate.test | Lead: Hebra |
| Dani Ortega | dani@sellervate.test | Specialist: Voltra, Boxwell |
| Leo Marín | leo@sellervate.test | Specialist: Voltra, Hebra |
| Sara Campos | sara@sellervate.test | Specialist: Boxwell, Hebra |

Password for everyone: `password123` (local demo data only). The app reads it from `DEMO_USER_PASSWORD` in `apps/web/.env.local`, on the server only.

## Switching roles

Login is simulated: pick a person on the home page, or from the menu in the top-right corner. The app signs in as that person on the server, so everything that follows runs with their real Supabase session. Authorization is not simulated: Postgres row level security and a server-side membership check decide what each person sees.

### Check the isolation in 10 seconds

With `pnpm dev` running, sign in as Dani (specialist on Voltra and Boxwell) and ask for Hebra's replies:

```bash
curl -s -c dani.txt -X POST http://localhost:3000/api/demo-session -H "Content-Type: application/json" -d '{"person":"dani"}'
curl -i -b dani.txt http://localhost:3000/api/brands/hebra/replies
```

Expected: `HTTP/1.1 403 Forbidden` and `{"error":"You do not have access to this brand."}`. The same request for `voltra` returns 200 with only Dani's own replies. Without the cookie it returns 401. A brand that does not exist also returns 403, so the API does not reveal which brands exist.

To see the same rules straight from Postgres, without Next in between:

```bash
docker exec -i supabase_db_sellervate-qa psql -U postgres -d postgres < supabase/tests/rls-matrix.sql
```

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
