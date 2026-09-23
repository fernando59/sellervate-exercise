---
id: TASK-009
titulo: Atar respuestas y reseñas a una membresía de la misma marca
estado: backlog
prioridad: baja
estimacion: ?
creada: 2026-09-23
actualizada: 2026-09-23
rama:
pr:
tags: [db, v2]
depende_de: [TASK-003]
bloqueada_por: decisión de diseño sobre qué pasa con una membresía que termina
---

# TASK-009 · Atar respuestas y reseñas a una membresía de la misma marca

## Qué se espera

La base impide que exista una respuesta de alguien que no trabaja en esa marca, o una reseña de alguien que no la lidera, aunque la escriba un proceso con permisos elevados como el futuro importador.

## Contexto

Lo marcó el subagente de aislamiento en TASK-002. Hoy nada ata `replies.specialist_id` ni `reviews.reviewer_id` a una membresía de la misma marca. Nadie de la API puede escribir en `replies`, y las políticas de TASK-003 cubren las reseñas, pero el importador va a correr con permisos elevados. Si inserta una respuesta de Hebra a nombre de Dani, la política `specialist_id = auth.uid()` se la mostraría.

La solución obvia, una FK `(specialist_id, brand_id) → brand_memberships(user_id, brand_id)`, choca con el `on delete cascade` de las membresías: quitar a alguien de una marca borraría todas sus respuestas. Por eso se deja para V2.

## Criterios de aceptación

- [ ] Insertar una respuesta con un especialista que no es miembro de esa marca falla
- [ ] Quitar a alguien de una marca no borra ni bloquea su historial
- [ ] La migración corre sobre datos existentes sin romper

## Fuera de alcance

El importador del helpdesk.

## Aislamiento entre marcas

Es el objetivo: cerrar a nivel de base una fuga que hoy solo evita la disciplina de quien escribe.

## Cómo se valida

1. Con psql como `postgres`, insertar una respuesta de Hebra con `specialist_id` de Dani → error.
2. Terminar la membresía de Leo en Hebra → sus respuestas siguen, y él ya no las ve (o sí, según la decisión).

## Qué se testearía

La FK y la política con pgTAP, sobre datos del seed.

## Verificación

`pnpm db:reset`, `pnpm db:types`, `tenant-isolation-reviewer`.

## Convenciones

Migración nueva; nunca editar una ya mergeada.

## Skills a usar

`supabase-postgres-best-practices`. `/grill-me` para cerrar la decisión antes de empezar.

## Documentación a consultar

Postgres: FKs compuestas y `on delete` (docs oficiales).

## Qué hacer

Decidir primero: membresía con `ended_at` (no se borra) o tabla de historial. Después, la FK compuesta con `on delete restrict`.

## Qué NO hacer

No agregar la FK compuesta mientras las membresías se borren con `cascade`.

## Notas de implementación

(vacío — no empezada)
