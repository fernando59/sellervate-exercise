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

Después de abrir un PR, darle al usuario (en español) **una lista de puntos concretos para comentar en su review**, incluidas las debilidades honestas del PR, y marcar qué dejaría pasar y por qué.

Tiempo:
- **Límite total: 6 h.** Recordarle al usuario que anote los minutos reales de cada PR en `docs/TIMELOG.md`.
- No pulir de más. Si falta tiempo, recortar según el orden de recorte del plan.

Logs de sesión: van a `ai-logs/NN-<tema>.md` + `.jsonl`, con el email del usuario reemplazado por `<redacted>`. Ojo: también aparece escapado dentro de comandos `sed`.

## No negociables

- **La autorización se aplica en el servidor**: RLS en Postgres **más** chequeos explícitos en `server/auth`. Ocultar UI no es autorización.
- **Nunca** usar la clave `service_role` en código de la app; solo en el seed.
- `brand_id` sale de la fila en la base de datos, **nunca** del input del request.
- Toda tabla nueva lleva RLS **en la misma migración**. Las vistas llevan `security_invoker = on`.
- Nada de enums de Postgres para catálogos; usar tablas o `text` + `check`.
- **Ninguna funcionalidad de IA ni scoring automático.** Las ideas sobre modelos van a DECISIONS.md en un párrafo.
- El seed es creíble (nada de lorem ipsum), las marcas suenan distintas y va en `seed.sql`, nunca en las migraciones.
- En la UI, colores y tipografía **solo con las clases de token** (`bg-surface`, `text-ink-muted`, `border-line`, `text-bad`…), nunca hex sueltos.

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
pnpm db:start     # Supabase local (Docker tiene que estar corriendo)
pnpm db:reset     # re-aplica migraciones + seed
pnpm db:status    # muestra la URL local y las claves
```

- **Next.js 16 cambió APIs respecto de versiones anteriores.** Antes de usar una API poco común, leer `apps/web/node_modules/next/dist/docs/` (ver `apps/web/AGENTS.md`).
- Variables de entorno: `apps/web/.env.local`, copiado de `apps/web/.env.example`. Nunca commitear secretos.
- Servicios de Supabase desactivados en `supabase/config.toml` para arrancar más rápido: realtime, storage, edge runtime, analytics y smtp.
- Entorno del usuario: Windows 11, Git Bash / PowerShell, Node 26, Docker Desktop, `gh` autenticado como `fernando59`.

## Estado actual

Actualizar esta lista cada vez que se mergea un PR.

- Repo: https://github.com/fernando59/sellervate-exercise (público; solo merge commits)
- [ ] PR1 `chore/scaffold`: abierto, pendiente de review del usuario (https://github.com/fernando59/sellervate-exercise/pull/1)
- [ ] PR2 `feat/schema-seed`
- [ ] PR3 `feat/authz`
- [ ] PR4 `feat/review-queue`
- [ ] PR5 `feat/my-feedback`
- [ ] PR6 `feat/brand-overview`
- [ ] PR7 `feat/states-polish`
- [ ] `docs/decisions`: DECISIONS.md, README final, TIMELOG

Pendientes conocidos que vienen del PR1:
- El texto de la home menciona `pnpm db:reset` antes de que exista el seed.
- `#user-switcher-slot` es un marcador vacío que se reemplaza en el PR3.
- `pnpm db:start` todavía no se probó en limpio; se prueba en el PR2.
