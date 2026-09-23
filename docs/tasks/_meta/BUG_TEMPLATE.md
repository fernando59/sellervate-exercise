---
id: TASK-000
titulo: Título corto en una línea
estado: backlog          # backlog | doing | testing | done
prioridad: media         # baja | media | alta | urgente — una fuga entre marcas es urgente
estimacion: ?            # en minutos — "?" hasta saber la causa raíz
creada: 2026-09-23
actualizada: 2026-09-23
rama:
pr:
tags: [bug]              # dejá el tag: distingue un bug de una funcionalidad
depende_de: []
bloqueada_por:
---

# TASK-000 · Título corto en una línea

<!-- ┌──────────────────────────────────────────────────────────────────────┐
     │ CÓMO USAR ESTA PLANTILLA                                             │
     │                                                                      │
     │ NO todo bug merece una tarea:                                        │
     │   · Bug DENTRO del alcance de la tarea en curso → se arregla en esa  │
     │     rama, en un commit `fix:` propio, y se anota en "Notas de        │
     │     implementación" de esa tarea. Es el caso más común.              │
     │   · Bug FUERA del alcance, o que necesita una decisión → esta        │
     │     plantilla, en docs/tasks/0-backlog/, y se sigue con lo que se    │
     │     estaba haciendo.                                                 │
     │                                                                      │
     │ Antes de nada: ¿existe el bug? Un bug descartado igual se documenta. │
     │                                                                      │
     │ "Causa raíz" y "Verificado contra" no llevan COMPLETAR: se llenan    │
     │ investigando. No bloquean el pase a 1-doing/, pero sin ellas la      │
     │ tarea no llega a 3-done/. Mismas verificaciones que TASK_TEMPLATE:   │
     │                                                                      │
     │   grep -c "^COMPLETAR" docs/tasks/0-backlog/TASK-XXX-*.md            │
     │   diff <(grep "^## " docs/tasks/_meta/BUG_TEMPLATE.md) \             │
     │        <(grep "^## " docs/tasks/0-backlog/TASK-XXX-*.md)             │
     └──────────────────────────────────────────────────────────────────────┘ -->

## Síntoma

<!-- Qué se ve mal: qué se esperaba y qué pasó. A QUIÉN le pasa (¿solo a un
     especialista? ¿solo en una marca?) y DESDE CUÁNDO (¿después de qué PR?
     `git log` sobre el archivo sospechoso suele dar la causa). -->

COMPLETAR

## Reproducción

<!-- Pasos exactos con datos del seed: qué persona, qué marca, qué ticket,
     qué URL o qué request. Estos mismos pasos son la validación del fix. -->

COMPLETAR

## Causa raíz

<!-- El PORQUÉ, no el dónde: te dice qué OTROS lugares tienen el mismo bug.
     Si ensució datos, cuáles. Si no era un bug, por qué. -->

(se completa al investigar)

## Verificado contra

<!-- Solo si hay librería, framework o Supabase de por medio: qué, versión,
     fuente (node_modules/next/dist/docs/, Context7), qué dice. Si es código
     propio: "ninguno (código propio)". Si contradice algo de CLAUDE.md o
     PLAN.md, se corrige en el mismo PR. -->

(se completa al investigar)

## Criterios de aceptación

<!-- Casi siempre:
       - [ ] Los pasos de "Reproducción" ya no producen el error
       - [ ] Queda una forma de comprobarlo (consulta SQL, curl) en el PR -->

COMPLETAR

## Fuera de alcance

<!-- Qué NO se toca arreglando esto. Otro bug encontrado = otra tarea. -->

COMPLETAR

## Aislamiento entre marcas

<!-- ¿El bug expone o expuso datos de otra marca o de otro especialista?
     Si sí, prioridad urgente y se dice en el PR. -->

COMPLETAR

## Verificación

<!-- pnpm typecheck && pnpm lint && pnpm build, pnpm db:reset si toca la
     base, los pasos de Reproducción a mano, y el subagente que corresponda.
     Si el bug viene de un patrón repetido, qué otros lugares se revisaron. -->

COMPLETAR

## Notas de implementación

<!-- Qué se probó, qué confundió, qué habría hecho falta para verlo antes. Si
     falta una convención, va a CLAUDE.md en el mismo PR. -->

(vacío — no empezada)
