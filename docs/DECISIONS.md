# Decisions

> Draft. Product, Architecture and Status are written in the final `docs/decisions` PR.

## Product

_TBD._

## Architecture

_TBD._

- **No component library (daisyUI was optional).** The UI uses its own tokens: sage neutrals, one ink-blue accent, semantic colours only for review outcomes. daisyUI's themes would have to be overridden token by token to keep that system, and the few components it would save (buttons, badges, inputs) are a few lines of Tailwind each.
- **No Docker files of our own.** The Supabase CLI already runs the local stack in Docker and applies migrations and the seed, so `pnpm bootstrap` wraps it into one command. Containerizing the Next app would add a build step without removing the Node requirement (the CLI needs it), and a hand-written self-hosted Supabase compose would lose `db reset` and type generation.

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

**Review subagents** (`.claude/agents/`, committed): before each PR is opened, read-only subagents check the diff. `code-reviewer` (Sonnet) looks for bugs and convention drift. `security-reviewer` (Sonnet) runs an OWASP-style pass on auth and input. `tenant-isolation-reviewer` (Opus) checks RLS, views and server checks against the role matrix, querying the local database as each seed user where it can. Tenant isolation gets the stronger model because a leak there costs a brand account. Their findings feed the human review on GitHub and do not replace it.

_Where the agent was right, where it was corrected, and a verbatim prompt: TBD._

## Status

_TBD._
