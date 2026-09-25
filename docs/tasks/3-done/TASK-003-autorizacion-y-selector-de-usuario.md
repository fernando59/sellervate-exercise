---
id: TASK-003
titulo: Autorización en el servidor y selector de usuario
estado: done
prioridad: alta
estimacion: 50
creada: 2026-09-23
actualizada: 2026-09-25
rama: feat/authz
pr: https://github.com/fernando59/sellervate-exercise/pull/4
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

- [x] El selector de la cabecera muestra la persona y el rol actuales, y cambia a cualquiera de las 5
- [x] Logueado como Dani, `GET /api/brands/hebra/replies` responde 403
- [x] Logueado como Leo, `GET /api/brands/hebra/replies` responde 200 con solo sus respuestas
- [x] Logueado como Marta, `GET /api/brands/hebra/replies` responde 403; `/api/brands/voltra/replies` responde 200 con todas
- [x] Sin sesión, la API responde 401
- [x] Con el JWT de Dani, un `select` directo a `replies` devuelve solo las suyas (RLS, sin pasar por Next)
- [x] Una reseña insertada con el JWT de Nuria sobre una respuesta de Voltra es rechazada
- [x] El README tiene el `curl` del 403 listo para copiar

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

- Migración nueva:
  - `is_lead_of(brand_id)`, `is_member_of(brand_id)` y un helper para "comparte marca con".
  - Políticas de `select` según la matriz de las notas (2026-09-23 · grill, Q4).
  - `reviews`: `insert` y `update` del propio lead, con `grant update (score, comment, is_exemplar)` y sin `delete`. `review_issues`: `insert` y `delete` si la reseña padre es propia y el usuario lidera la marca.
  - `revoke all` a `anon`; `revoke truncate, references, trigger` a `authenticated`; `alter default privileges` para las tablas futuras.
- `server/supabase/server.ts`, `server/auth/session.ts` (`getCurrentUser` con `getUser()`, `requireMember`, `requireLeadOf`), errores 401/403 tipados.
- `proxy.ts` para renovar la sesión (confirmar el nombre en la doc local de Next 16).
- `server/auth/demo-users.ts`: las 5 personas del seed (email, nombre, etiqueta de rol). La contraseña sale de `DEMO_USER_PASSWORD` (solo servidor); si falta, el selector se desactiva. `bootstrap` agrega la variable a `.env.local` si no está.
- Server action del selector: `signInWithPassword` **del lado del servidor**.
- `/` sin sesión: las 5 personas con su rol; la cabecera dice "Choose a person". Sin login automático.
- `app/api/brands/[slug]/replies/route.ts`: 401 sin sesión; 403 si la marca no existe o no eres miembro (indistinguibles). Devuelve solo los campos de Q13.
- `app/api/demo-session/route.ts` (`POST`, `{ person }`): el mismo login que el selector, para el `curl` del README.
- "Sign out" en el selector; al cambiar de persona, `router.refresh()` en la misma página.
- Reemplazar `#user-switcher-slot`.
- `supabase/tests/rls-matrix.sql`: cuántas filas de cada tabla ve cada persona, para correr a mano con psql.

## Qué NO hacer

- No mandar la contraseña del seed al cliente ni ponerla en una variable `NEXT_PUBLIC_*`.
- No usar `service_role` para "facilitar" el login.
- No filtrar por `specialist_id` en JS: lo hace RLS y el chequeo del servidor.
- No devolver 404 vs 403 de forma que revele si una marca existe para alguien que no es miembro.

## Notas de implementación

### 2026-09-25 · Puntos de la review (usuario)
- **1:** el revoke global de `execute` no le quitó el permiso a ninguna función existente (`pgcrypto` y `uuid-ossp` se instalan antes). Ahora lo comprueba `rls-matrix.sql`.
- **3:** ya estaba resuelto en `1b49db9`.
- **5:** `/api/demo-session` compara el media type exacto. Antes `text/plain; x=application/json` pasaba el chequeo.
- **7: cambia la decisión Q4 sobre `profiles`.** Antes: "quien comparta alguna marca contigo". Ahora: solo si uno de los dos es lead en esa marca. El lead ve a su equipo y el especialista ve a sus leads; dos especialistas no se ven entre sí. Perfiles visibles: dani 2 (antes 4), leo 3 (antes 5), sara 3 (antes 5); los leads no cambian.
- **8:** regla nueva en CLAUDE.md y en PLAN § 12: una migración que ya está en `main` no se edita.
- **6 (`using (true)` en `issue_types`) se deja:** reescribirlo como `auth.uid() is not null` es equivalente bajo `to authenticated` y solo esconde la decisión. Es el `leaving this:` del PR.

### 2026-09-23 · Subagentes (antes del PR)
- `security-reviewer` y `code-reviewer`: nada bloqueante. Menores: `/api/demo-session` sin zod (zod entra en TASK-004; la lista cerrada de 5 claves hace de whitelist) y sin rate limiting (no hay credenciales que adivinar).
- `tenant-isolation-reviewer`: sin fugas. Arreglado en la migración, que todavía no se había subido:
  1. `alter default privileges … in schema public revoke execute … from public` no hacía nada, porque un revoke por esquema no quita un default global. Una función `security definer` nueva en `public` quedaba ejecutable por `anon` vía `/rest/v1/rpc`. Ahora hay un revoke global.
  2. Si un especialista deja la marca, el lead dejaba de ver su perfil y la API daba 500 (`r.specialist` null). Se agregó `authored_reply_in_led_brand` a la política de `profiles`.
  3. El `insert` en `reviews` aceptaba `created_at`, `updated_at` e `id` del cliente. Ahora el insert también va con grant de columnas.
  4. `review_issues` aceptaba etiquetas con `active = false`. Ahora el `with check` lo impide.
  - Los cuatro quedaron como aserciones en `rls-matrix.sql`.
  - El aviso para `/me` se anotó en TASK-005.

### 2026-09-23 · Implementación
- **Helpers en el esquema `private`**, no en `public`: PostgREST no los expone como RPC. `authenticated` necesita `execute` igual, porque las políticas se evalúan con el rol de quien consulta (el ejemplo de la skill revoca `execute` a `authenticated`, y eso rompería todas las políticas).
- **`issue_types_select` es `using (true)`**: es la única política incondicional. El catálogo es global y no tiene datos de ninguna marca. Queda explicado en la migración.
- **`updated_at` de `reviews` lo pone un trigger**: no está en el grant de columnas, así que la app no puede escribirlo.
- **Cookie de sesión `httpOnly`**: `@supabase/ssr` la deja legible desde JS por defecto (`httpOnly: false`). Se fuerza con `cookieOptions` en `server.ts` y en `proxy.ts`, que tienen que coincidir. Verificado: `document.cookie` queda vacío.
- **`requireMember`/`requireLeadOf` son síncronos** y trabajan sobre las membresías que `getOptionalUser()` ya cargó (con `cache` de React, por request). Esas membresías salen de la base de datos con RLS, no del request.
- **`/api/demo-session` solo acepta JSON** (415 si no): un formulario de otro sitio no puede mandar `application/json` sin preflight, así que no puede loguear a un visitante como otra persona.
- **Visto una vez, no reproducido (0/20):** `PGRST303 "JWT issued at future"` en la primera consulta justo después del login. Es un desfase de menos de 1 s entre los contenedores de Auth y PostgREST, no algo del código. Si el evaluador lo ve, recargar lo resuelve.
- **Dev server:** Next 16 no deja correr dos `next dev` en la misma carpeta. La verificación se hizo con `next start` en el puerto 3100 (config `web-start` en `.claude/launch.json`, que no se commitea).
- Matriz RLS (`supabase/tests/rls-matrix.sql`): marta 35 respuestas / 0 de Hebra, nuria 10 / 10, dani 15 / 0, leo 15 / 5, sara 15 / 5; `foreign_replies` = 0 para todos.

### 2026-09-23 · Grill, ronda 1 (decidido)
- **Q1 contraseña del seed:** variable de entorno solo del servidor `DEMO_USER_PASSWORD`, no una constante. En producción no existiría; va a DECISIONS.md.
- **Q2 lista del selector:** fija en `server/auth/demo-users.ts`. `anon` no lee nada de la base; los permisos reales salen de `brand_memberships`.
- **Q3 sin sesión:** sin login automático; `/` muestra las 5 personas y sirve de guía para el evaluador.
- **Q4 lecturas:**
  - `brands`: las marcas de las que eres miembro.
  - `brand_memberships`: las propias, más todas las de las marcas que lideras.
  - `profiles`: tú, más quien comparta alguna marca contigo (solo nombres).
  - `issue_types`: cualquier usuario autenticado.
  - `brand_events`: los miembros de la marca.
  - Ninguna tiene políticas de escritura.
- **Q5 reseñas:** `insert` y `update` de la propia, con grant de columna (`score`, `comment`, `is_exemplar`); nadie borra.
- **Q6:** `proxy.ts` para renovar el token.
- **Q7:** `getUser()`, no `getClaims()`.
- **Q8:** `revoke all` a `anon` y `revoke truncate, references, trigger` a `authenticated`, con default privileges.
- **Q9:** una marca que no existe responde 403, igual que una ajena.
- **Q10:** script `supabase/tests/rls-matrix.sql`, además de pegar la salida en el PR.

### 2026-09-23 · Grill, ronda 3 (decidido; grill cerrado)
- **Q16 crítica ⇒ nota ≤ 2:** se aplica de verdad (`refine` de zod compartido + chequeo en `save_review`). Es de TASK-004.
- **Q17 sin acceso en páginas:** `notFound()` (404, no revela que la marca existe); la API sigue con 403. Sin `experimental.authInterrupts`: en Next 16.3.5 `forbidden()` sigue siendo experimental. `server/auth` lanza errores tipados; cada capa los traduce.

### 2026-09-23 · Grill, ronda 2 (decidido)
- **Q11 después de elegir persona:** se queda en la misma página y se recarga con la nueva sesión, para ver el aislamiento en el momento. Redirigir según el rol queda para TASK-004.
- **Q12:** "Sign out" al final del selector; vuelve a `/`.
- **Q13 campos de la API:** `id`, `external_id`, `subject`, `specialist` (`id` y nombre), `sent_at` y `score` (`null` si no está reseñada). Sin textos de mensajes.
- **Q14 guardar reseña:** función `save_review(...)` con `security invoker`, transaccional, que deriva `brand_id` de `replies`. Se escribe en TASK-004; las políticas de esta tarea tienen que permitirla.
- **Q15 curl del README:** `POST /api/demo-session` con `{ "person": "dani" }`, que reutiliza el login del selector (cookie jar con `curl -c` / `-b`). Cambia el "único route handler" del plan: actualizar `docs/PLAN.md` § 5 en el PR de esta tarea.
