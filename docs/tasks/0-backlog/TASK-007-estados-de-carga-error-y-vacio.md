---
id: TASK-007
titulo: Estados de carga, error, vacío y no encontrado diseñados
estado: backlog
prioridad: media
estimacion: 25
creada: 2026-09-23
actualizada: 2026-09-23
rama:
pr:
tags: [ui]
depende_de: [TASK-004, TASK-005, TASK-006]
bloqueada_por:
---

# TASK-007 · Estados de carga, error, vacío y no encontrado diseñados

## Qué se espera

Ninguna pantalla muestra un blanco, un spinner genérico o un stack trace: cada estado dice qué pasó y qué hacer.

## Contexto

El enunciado pide explícitamente estados vacío, de carga y de error diseñados (docs/PLAN.md § 9). Ya existe `ui/empty-state.tsx` desde TASK-001.

## Criterios de aceptación

- [ ] Cada ruta con datos tiene `loading.tsx` con un esqueleto de su forma real
- [ ] `error.tsx` explica qué pasó sin mostrar el mensaje crudo de Postgres, con botón de reintentar
- [ ] `not-found.tsx` para respuesta o marca inexistente o ajena
- [ ] Vacíos: cola sin respuestas ayer, "todo reseñado", especialista sin reseñas, marca sin datos

## Fuera de alcance

Animaciones, toasts, cambios de layout.

## Aislamiento entre marcas

El 404 de una respuesta ajena y el de una inexistente se ven iguales: no revelan que existe.

## Cómo se valida

1. Como Marta, filtrar "sin reseñar" y reseñar todo: aparece el vacío "todo reseñado".
2. Como Marta, `/me`: vacío explicado.
3. `/replies/00000000-0000-0000-0000-000000000000`: not found.
4. Parar Supabase y recargar `/review`: el error diseñado.

## Qué se testearía

Nada automático: es presentación.

## Verificación

`pnpm typecheck && pnpm lint && pnpm build`, cada estado en el navegador, en claro y oscuro, y `code-reviewer`.

## Convenciones

Solo clases de token. Textos en inglés, cortos, que digan qué hacer.

## Skills a usar

`frontend-design`, `accessibility`.

## Documentación a consultar

Next 16: `loading.tsx`, `error.tsx` (client component, `reset`/`unstable_retry`), `not-found.tsx`.

## Qué hacer

Los archivos de estado por ruta y los textos de cada vacío.

## Qué NO hacer

No mostrar `error.message` crudo.

## Notas de implementación

### 2026-09-25 · Adelantado en TASK-004
- `/review` y `/replies/[id]` ya tienen su `not-found.tsx` diseñado, con salida a la cola o al inicio (`ui/link-button.tsx`). Faltan el `not-found` global, los `loading.tsx` y los `error.tsx`.

(vacío — no empezada)
