---
id: TASK-003
titulo: Autorización en el servidor y selector de usuario
estado: backlog
prioridad: alta
estimacion: 50
creada: 2026-09-23
actualizada: 2026-09-23
rama:
pr:
tags: [authz, security, db]
depende_de: [TASK-002]
bloqueada_por:
---

# TASK-003 · Autorización en el servidor y selector de usuario

## Qué se espera

Cualquiera puede "ser" Marta, Nuria, Dani, Leo o Sara desde una esquina de la app, y cada una ve solo lo que le corresponde. Si Dani pide por API las respuestas de Hebra, la API responde que no.

## Contexto

docs/PLAN.md § 3 (matriz de roles) y § 6 (autorización). El login se puede simular; la autorización no. Defensa en profundidad: RLS en Postgres más un chequeo explícito en `server/auth` para que la API diga 403 y no una lista vacía. El selector hace `signInWithPassword` en el servidor y `@supabase/ssr` guarda la sesión en cookies httpOnly, así RLS ve un `auth.uid()` real. Descartado: firmar JWT a mano (plan B, depende de la clave legacy).

## Criterios de aceptación

- [ ] El selector de la cabecera muestra la persona y el rol actuales, y cambia a cualquiera de las 5
- [ ] Logueado como Dani, `GET /api/brands/hebra/replies` responde 403
- [ ] Logueado como Leo, `GET /api/brands/hebra/replies` responde 200 con solo sus respuestas
- [ ] Logueado como Marta, `GET /api/brands/hebra/replies` responde 403; `/api/brands/voltra/replies` responde 200 con todas
- [ ] Sin sesión, la API responde 401
- [ ] Con el JWT de Dani, un `select` directo a `replies` devuelve solo las suyas (RLS, sin pasar por Next)
- [ ] Una reseña insertada con el JWT de Nuria sobre una respuesta de Voltra es rechazada
- [ ] El README tiene el `curl` del 403 listo para copiar

## Fuera de alcance

Las pantallas (cola, mi feedback, marca). Login real. Integridad de membresías a nivel de FK (TASK-009).

## Aislamiento entre marcas

Es el núcleo de la tarea. Revisar todo el checklist de PLAN.md § 12: ninguna política `using (true)`, `is_lead_of` como `security definer` con `search_path = ''` y `auth.uid()` adentro, `brand_id` nunca del request, `service_role` en ningún archivo de `apps/web`. Políticas de `insert`/`update` de `reviews` con `with check` que no dejen cambiar `brand_id`, `reviewer_id` ni `reply_id`. `revoke truncate` a `anon` y `authenticated` (lo marcó el subagente en TASK-002).

## Cómo se valida

1. `pnpm bootstrap && pnpm dev`
2. En el selector, elegir Dani. Copiar la cookie de sesión desde las devtools.
3. `curl -i http://localhost:3000/api/brands/hebra/replies -H "Cookie: <cookie>"` → 403
4. Cambiar a Leo y repetir → 200, solo respuestas con `specialist_id` de Leo
5. Cambiar a Marta: `/api/brands/voltra/replies` → 200 con las 20; `/hebra/` → 403

## Qué se testearía

Las políticas RLS con pgTAP (`supabase test db`): por cada persona del seed, qué filas ve de cada tabla. Es donde un error cuesta una cuenta. Mientras tanto, la matriz se prueba con psql (`set local role authenticated; set local request.jwt.claims = ...`) y queda pegada en el PR.

## Verificación

`pnpm typecheck && pnpm lint && pnpm build`, `pnpm db:reset`, la matriz de arriba con curl y psql, y los tres subagentes: `code-reviewer`, `tenant-isolation-reviewer` (Opus) y `security-reviewer`.

## Convenciones

Todo `server/` con `import 'server-only'`. Un cliente de Supabase por request. `getUser()` (valida contra Auth), no `getSession()`, en el servidor. Tipos desde `database.types.ts`.

## Skills a usar

`supabase-postgres-best-practices`, `owasp-security`, `security-audit`. Correr `/grill-me` antes de empezar: quedan decisiones abiertas (ver Qué hacer).

## Documentación a consultar

`@supabase/ssr` para Next App Router (cookies, `createServerClient`), Next 16 route handlers y `cookies()` async en `node_modules/next/dist/docs/`.

## Qué hacer

- Migración nueva: `is_lead_of(brand_id)`, `is_member_of(brand_id)`, políticas de `select` para todas las tablas y de `insert`/`update` para `reviews` y `review_issues`, `revoke truncate`.
- `server/supabase/server.ts`, `server/auth/session.ts` (`getCurrentUser`, `requireMember`, `requireLeadOf`), errores 401/403/404 tipados.
- Server action del selector: `signInWithPassword` con la contraseña del seed **del lado del servidor**.
- `app/api/brands/[slug]/replies/route.ts`.
- Reemplazar `#user-switcher-slot`.

## Qué NO hacer

- No mandar la contraseña del seed al cliente ni ponerla en una variable `NEXT_PUBLIC_*`.
- No usar `service_role` para "facilitar" el login.
- No filtrar por `specialist_id` en JS: lo hace RLS y el chequeo del servidor.
- No devolver 404 vs 403 de forma que revele si una marca existe para alguien que no es miembro.

## Notas de implementación

(vacío — no empezada)
