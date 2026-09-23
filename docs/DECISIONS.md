# Decisions

> Draft. Product, Architecture and Status are written in the final `docs/decisions` PR.

## Product

_TBD._

## Architecture

_TBD._

## AI

**Documentation before code.** Before the agent uses any library API, it reads the docs for the installed version, either through Context7 or the official docs. For Next.js 16 it reads the docs bundled in `node_modules/next/dist/docs/`, because the model's training data predates several API changes.

**Agent skills used** (installed per user, not committed to the repo):

| Skill | Source | Used for |
|---|---|---|
| `supabase-postgres-best-practices` | supabase/agent-skills | Migrations, RLS policies, indexes |
| `owasp-security`, `security-audit` | community | Reviewing the authorization PR |
| `react-hook-form-zod`, `rhf-form-config` | community / own | Review form: one zod schema shared by client and server action |
| `dataviz` | built-in | Weekly trend chart |
| `frontend-design`, `accessibility` | anthropics/skills / community | Visual direction, keyboard and screen-reader checks |

_Where the agent was right, where it was corrected, and a verbatim prompt: TBD._

## Status

_TBD._
