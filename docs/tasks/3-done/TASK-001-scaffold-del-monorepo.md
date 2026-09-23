---
id: TASK-001
titulo: Scaffold del monorepo, Supabase local y tokens de diseño
estado: done
prioridad: alta
estimacion: 30
creada: 2026-09-23
actualizada: 2026-09-23
rama: chore/scaffold
pr: https://github.com/fernando59/sellervate-exercise/pull/1
tags: [scaffold, docs]
depende_de: []
bloqueada_por:
---

# TASK-001 · Scaffold del monorepo, Supabase local y tokens de diseño

<!-- Tarea creada después de hecha, al introducir el tablero de tareas. -->

## Qué se espera

Un repo que cualquiera clona y levanta: la app Next vacía con el diseño base, Supabase local configurado y las reglas de trabajo escritas antes de la primera línea de producto.

## Contexto

Primer PR del plan (docs/PLAN.md § 11). En el mismo PR entraron, además del scaffold, las reglas de librerías, los subagentes de review, la convención de comentarios y el TIMELOG: son decisiones de proceso que tenían que existir antes del PR2. Se descartaron daisyUI (choca con los tokens propios) y un docker-compose propio (el CLI de Supabase ya usa Docker).

## Criterios de aceptación

- [x] `pnpm install && pnpm dev` levanta la app en http://localhost:3000
- [x] `pnpm typecheck`, `pnpm lint` y `pnpm build` pasan
- [x] Los tokens de color y tipografía están en `globals.css`, con modo oscuro
- [x] No hay claves en el repo; `.env.example` lista las variables

## Fuera de alcance

Esquema, seed, autorización y cualquier pantalla con datos.

## Aislamiento entre marcas

(no aplica: no hay datos todavía)

## Cómo se valida

1. `pnpm install && pnpm dev`
2. Abrir http://localhost:3000: shell con la cabecera y el estado vacío.

## Qué se testearía

Nada: no hay lógica.

## Verificación

`pnpm typecheck`, `pnpm lint`, `pnpm build`: en verde al abrir el PR.

## Convenciones

Agregó a CLAUDE.md: librerías por PR, doc antes de código, subagentes de review, convención de comentarios de review.

## Skills a usar

`frontend-design` (tokens y tipografía).

## Documentación a consultar

Next 16 (`node_modules/next/dist/docs/`), Tailwind v4 (`@theme inline`).

## Qué hacer

Hecho.

## Qué NO hacer

Hecho.

## Notas de implementación

### 2026-09-23 · Mergeado sin review escrita
El PR se mergeó sin comentarios en GitHub. Queda como lección para los siguientes: la review escrita es el criterio que más pesa.
