# Sellervate QA: instrucciones para el agente

Ejercicio técnico para Sellervate (Product Engineer, full stack). Es una herramienta interna donde los team leads evalúan respuestas de soporte **ya enviadas** y los especialistas leen el feedback sobre su propio trabajo.

**Todo el contexto y las decisiones ya tomadas están en el plan, que se carga a continuación.** No hay que volver a preguntarle al usuario lo que ya está ahí.

@docs/PLAN.md

---

## Idioma

- **Con el usuario: siempre en español.**
- **Documentos de planificación para el usuario y el agente** (`CLAUDE.md`, `docs/PLAN.md`): en español.
- **Lo que lee el equipo evaluador de Sellervate** (código, textos de la app, commits, PRs, `README.md`, `docs/DECISIONS.md`, `docs/TIMELOG.md`): en **inglés**.

## Forma de trabajar (obligatoria)

1. **Una rama y un PR pequeño por tarea** (legible en ~5 minutos), siguiendo el plan de PRs (sección 11 del plan). La rama sale de un `main` actualizado (`git checkout main && git pull`).
2. **El agente escribe el código, hace los commits y abre el PR** con `gh pr create`.
3. **La review la escribe el usuario en GitHub.** El agente **nunca** comenta, aprueba ni hace merge en nombre del usuario.
4. Después de la review, las correcciones van en **commits nuevos en la misma rama**.
5. El usuario hace el merge con **"Create a merge commit"**.

Reglas de Git:
- **Prohibido:** squash, rebase, force-push y amend de commits ya subidos. El repo solo permite merge commits, y el historial se evalúa.
- **Commits:** prefijo convencional (`feat`, `fix`, `chore`, `docs`, `refactor`), un cuerpo que explique **por qué** y el trailer `Co-Authored-By`.
- **Descripción del PR**, con estas secciones: **What**, **Checks** (lo que se corrió de verdad y lo que **no** se verificó) y **Out of scope**.

Antes de abrir un PR:
- Correr `pnpm typecheck`, `pnpm lint` y `pnpm build` desde la raíz.
- Si cambió la UI, mirar la página en el navegador.
- Si cambió el esquema, correr `pnpm db:reset` y comprobar que el seed carga.
- Pasar los subagentes de `.claude/agents/` (en paralelo) y resumirle al usuario lo que encontraron:
  - `code-reviewer` (Sonnet): siempre.
  - `tenant-isolation-reviewer` (Opus): si el PR toca migraciones, RLS, vistas, `server/`, server actions, route handlers o caché.
  - `security-reviewer` (Sonnet): si toca auth, sesión, cookies, variables de entorno o dependencias nuevas.
  - Sus hallazgos son insumo para el usuario, no reemplazan su review en GitHub.

Después de abrir un PR, darle al usuario (en español) **una lista de puntos concretos para comentar en su review**, incluidas las debilidades honestas del PR, y marcar qué dejaría pasar y por qué. Cada punto va con `archivo:línea` y el comentario ya redactado **en inglés**, con la convención de abajo, listo para pegar.

Convención de review (la escribe el usuario en GitHub):
- Comentarios **en líneas concretas** ("Start a review") y un resumen corto al final con **Review changes → Comment**. GitHub no deja que el autor apruebe ni pida cambios en su propio PR.
- Prefijos:

| Prefijo | Uso |
|---|---|
| `blocking:` | Hay que arreglarlo antes del merge |
| `question:` | Entender una decisión |
| `suggestion:` | Mejora opcional |
| `nit:` | Detalle menor, no bloquea |
| `leaving this:` | Se deja pasar a propósito, con la razón (al menos uno por PR) |

- Cada comentario es concreto y trae el escenario ("logged in as Dani, X returns Y"). Nada de problemas inventados: si el PR está bien, "LGTM, merging" alcanza.
- Las correcciones van en commits nuevos. El usuario responde "Fixed in `<hash>`" en el hilo y lo resuelve. El agente, en el mensaje del commit, dice qué comentario atiende.

Tiempo:
- **Límite total: 6 h.** Recordarle al usuario que anote los minutos reales de cada PR en `docs/TIMELOG.md`.
- No pulir de más. Si falta tiempo, recortar según el orden de recorte del plan.

Logs de sesión: van a `ai-logs/NN-<tema>.md` + `.jsonl`, con el email del usuario reemplazado por `<redacted>`. Ojo: también aparece escapado dentro de comandos `sed`.
- **Se exportan solos** al cerrar o limpiar la sesión: hook `SessionEnd` en `.claude/settings.local.json` → `.claude/hooks/export-session-log.mjs`. Los dos archivos son locales y no se commitean porque tienen el email. El hook redacta el email, las claves `sb_secret_…` y cualquier JWT de `service_role`. Si la sesión ya tenía log, lo sobrescribe; si no, crea el `NN` siguiente con el nombre de la rama.
- **El hook no commitea.** Al empezar una sesión, si `git status` muestra `ai-logs/` modificado o nuevo, el agente lo commitea (`docs: session log …`) en la rama de la tarea en curso.

## No negociables

- **La autorización se aplica en el servidor**: RLS en Postgres **más** chequeos explícitos en `server/auth`. Ocultar UI no es autorización.
- **Nunca** usar la clave `service_role` en código de la app; solo en el seed.
- `brand_id` sale de la fila en la base de datos, **nunca** del input del request.
- Toda tabla nueva lleva RLS **en la misma migración**. Las vistas llevan `security_invoker = on`.
- Nada de enums de Postgres para catálogos; usar tablas o `text` + `check`.
- **Ninguna funcionalidad de IA ni scoring automático.** Las ideas sobre modelos van a DECISIONS.md en un párrafo.
- El seed es creíble (nada de lorem ipsum), las marcas suenan distintas y va en `seed.sql`, nunca en las migraciones.
- En la UI, colores y tipografía **solo con las clases de token** (`bg-surface`, `text-ink-muted`, `border-line`, `text-bad`…), nunca hex sueltos.

## Librerías y documentación

- **Primero la documentación, después el código.** Antes de usar la API de una librería, consultar Context7 (`resolve-library-id` → `query-docs`, indicando la versión instalada) o la documentación oficial. En Next 16 manda la doc local (`apps/web/node_modules/next/dist/docs/`).
- **Cada dependencia se instala en el PR que la usa por primera vez**, y el PR explica por qué la necesita.

| Librería | PR | Notas |
|---|---|---|
| `@supabase/supabase-js` + `@supabase/ssr` | 3 | Un cliente por request, con las cookies de sesión |
| `server-only` | 3 | En todo `server/`: el build falla si algo del servidor se importa desde el cliente |
| `zod` (v4) | 4 | Importar desde `"zod"` y usar la API v4 |
| `react-hook-form` + `@hookform/resolvers` | 4 | Formularios con `zodResolver` |
| `recharts` + `react-is` | 6 | `react-is` es peer dependency y pnpm no la instala sola |

Descartadas: daisyUI (sus temas chocan con nuestros tokens y el diseño tiene que verse propio; va a Architecture en DECISIONS.md), shadcn, TanStack Query/Table, tRPC, date-fns (alcanza con `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat`) y clsx.

Formularios (RHF + zod):
- **Un solo schema para cliente y servidor**, en `features/<dominio>/<form>.config.ts`: schema, tipos inferidos, defaults y labels. El `.tsx` queda con el JSX y los handlers (patrón de la skill `rhf-form-config`, con server action en lugar de route handler).
- La server action **vuelve a correr `schema.parse`**: la validación del cliente es para la UX, no para la seguridad.
- `handleSubmit` llama a la action dentro de `startTransition` (sin `useActionState`). La nota y las etiquetas van con `Controller`, y los atajos `1`–`5` usan `setValue`.

Gráfico (Recharts):
- Client component (`'use client'`) que recibe los datos ya serializados desde un Server Component.
- Colores desde variables CSS (`var(--accent)`, `var(--line)`…), nunca hex.

Tipos de la base: generarlos con `supabase gen types --local` en `apps/web/server/supabase/database.types.ts` con `pnpm db:types`. Se regeneran y se commitean en cada PR que cambia el esquema.

Skills (instaladas globalmente en `~/.claude/skills`, no en el repo):

| Tarea | Skill |
|---|---|
| Migraciones, RLS, índices | `supabase-postgres-best-practices` |
| Revisar autorización (PR3) | `owasp-security`, `security-audit` |
| Formularios | `react-hook-form-zod`, `rhf-form-config` |
| Gráfico | `dataviz` + Context7 para Recharts |
| UI | `frontend-design`, `accessibility` |

`vercel-react-best-practices` y `nextjs-react-typescript` pueden estar desactualizadas para Next 16: ante una diferencia, manda la doc local de Next.

## Stack y comandos

Workspace pnpm 11:
- `apps/web`: Next.js **16** App Router + TypeScript + Tailwind **v4**.
- `supabase/`: config local, migraciones y seed.
- El CLI de Supabase es devDependency de la raíz: se usa como `pnpm exec supabase …`, no hay instalación global.

```bash
pnpm install
pnpm dev          # Next en http://localhost:3000
pnpm typecheck    # next typegen && tsc --noEmit (LayoutProps/PageProps son tipos generados)
pnpm lint
pnpm build
pnpm bootstrap    # Supabase local + migraciones + seed + .env.local (Docker tiene que estar corriendo)
pnpm db:start     # solo levanta Supabase local
pnpm db:reset     # re-aplica migraciones + seed
pnpm db:status    # muestra la URL local y las claves
pnpm db:types     # regenera apps/web/server/supabase/database.types.ts desde la base local
```

- **Next.js 16 cambió APIs respecto de versiones anteriores.** Antes de usar una API poco común, leer `apps/web/node_modules/next/dist/docs/` (ver `apps/web/AGENTS.md`).
- Variables de entorno: `apps/web/.env.local`, copiado de `apps/web/.env.example`. Nunca commitear secretos.
- Servicios de Supabase desactivados en `supabase/config.toml` para arrancar más rápido: realtime, storage, edge runtime, analytics y smtp.
- Entorno del usuario: Windows 11, Git Bash / PowerShell, Node 26, Docker Desktop, `gh` autenticado como `fernando59`.

## Estado actual

Actualizar esta lista cada vez que se mergea un PR.

- Repo: https://github.com/fernando59/sellervate-exercise (público; solo merge commits)
- [x] PR1 `chore/scaffold`: mergeado (https://github.com/fernando59/sellervate-exercise/pull/1), sin review escrita
- [x] PR2 `feat/schema-seed`: mergeado (https://github.com/fernando59/sellervate-exercise/pull/2), sin review escrita
- [ ] `chore/task-board` (tablero `docs/tasks/`): abierto (https://github.com/fernando59/sellervate-exercise/pull/3), pendiente de review
- [ ] PR3 `feat/authz`: en curso (en GitHub será el #4, porque el #3 es el tablero)
- [ ] PR4 `feat/review-queue`
- [ ] PR5 `feat/my-feedback`
- [ ] PR6 `feat/brand-overview`
- [ ] PR7 `feat/states-polish`
- [ ] `docs/decisions`: DECISIONS.md, README final, TIMELOG

Pendientes conocidos:
- `#user-switcher-slot` es un marcador vacío que se reemplaza en el PR3.
- Las tablas tienen RLS activado pero sin políticas: hasta el PR3, la API no devuelve nada.
- Nunca usar comillas invertidas dentro de strings de `bash -c`/`node -e`: bash las ejecuta. Para editar texto con Markdown, usar la herramienta Edit.
