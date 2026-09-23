---
id: TASK-002
titulo: Esquema, seed creíble y levantar todo con pnpm bootstrap
estado: done
prioridad: alta
estimacion: 60
creada: 2026-09-23
actualizada: 2026-09-23
rama: feat/schema-seed
pr: https://github.com/fernando59/sellervate-exercise/pull/2
tags: [db, seed]
depende_de: [TASK-001]
bloqueada_por:
---

# TASK-002 · Esquema, seed creíble y levantar todo con pnpm bootstrap

<!-- Tarea creada con el PR ya abierto, al introducir el tablero de tareas. -->

## Qué se espera

La base guarda marcas, personas con su rol por marca, las respuestas enviadas y las reseñas, y viene cargada con datos creíbles para que Marta tenga cola ayer y la tendencia de Voltra tenga sentido. Todo se levanta con un comando.

## Contexto

docs/PLAN.md § 7 (modelo de datos) y § 10 (seed). Rol por marca en `brand_memberships`, no en `profiles`. FK compuesta en `reviews` para que la reseña no mienta sobre su marca. `unique(source, external_id)` para el futuro importador. Sin enums. Se descartó un docker-compose propio a favor de `pnpm bootstrap` sobre el CLI.

## Criterios de aceptación

- [x] `pnpm bootstrap` desde cero deja la base con migración + seed y escribe `.env.local` solo con la anon key
- [x] Las 8 tablas tienen RLS activado; `anon` recibe `[]`
- [x] Una reseña con el `brand_id` de otra marca es rechazada por la FK compuesta
- [x] Los 5 usuarios del seed pueden hacer login con `password123`
- [x] Ayer hay respuestas sin reseñar en Voltra y Boxwell
- [x] Borrar una respuesta con reseñas falla (no se pierde historial)

## Fuera de alcance

Políticas RLS, login desde la app, selector de usuario, API con 403 (TASK-003). Atar `specialist_id`/`reviewer_id` a una membresía de la misma marca (TASK-009).

## Aislamiento entre marcas

RLS activado sin políticas: todo cerrado hasta TASK-003. Verificado por el subagente `tenant-isolation-reviewer` con el JWT de Dani (0 filas) y con curl anónimo.

## Cómo se valida

1. `pnpm bootstrap`
2. `curl http://127.0.0.1:54321/rest/v1/replies -H "apikey: <anon>"` → `[]`
3. Login de `dani@sellervate.test` contra `/auth/v1/token?grant_type=password` → token

## Qué se testearía

Las restricciones del esquema con pgTAP: la FK compuesta, el `restrict` de reviews → replies, `unique(source, external_id)`.

## Verificación

`pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm db:reset` ×2, subagentes `code-reviewer` y `tenant-isolation-reviewer`: en verde.

## Convenciones

Seed solo en `seed.sql`; el catálogo `issue_types` va en la migración por ser dato de referencia. Tipos generados con `pnpm db:types` y commiteados.

## Skills a usar

`supabase-postgres-best-practices`.

## Documentación a consultar

Supabase CLI (`status -o json`, `gen types`) y seed de usuarios de Auth, vía Context7.

## Qué hacer

Hecho.

## Qué NO hacer

No editar la migración una vez mergeada: cualquier cambio posterior va en una migración nueva.

## Notas de implementación

### 2026-09-23 · Mergeado sin review escrita
El PR2 se mergeó sin comentarios del usuario en GitHub. Dos commits de logs de sesión quedaron en la rama después del merge y entran a `main` con `feat/authz`.

### 2026-09-23 · reviews → replies pasa a restrict
Bug dentro del alcance, encontrado revisando los `on delete`: la FK hacía `cascade`, así que borrar una respuesta borraba sus reseñas sin avisar. Arreglado en `ec7d190` (migración editada en el lugar porque no estaba mergeada).

### 2026-09-23 · `pnpm setup` → `pnpm bootstrap`
`pnpm setup` es un comando propio de pnpm y le gana al script.

### 2026-09-23 · Integridad de membresías, a V2
El subagente de aislamiento propuso una FK `(specialist_id, brand_id) → brand_memberships`. Con el `cascade` de las membresías, quitar a alguien de una marca borraría sus respuestas. Se pasa a TASK-009.
