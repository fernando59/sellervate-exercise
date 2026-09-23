---
id: TASK-000
titulo: Título corto en una línea
estado: backlog          # backlog | doing | testing | done
prioridad: media         # baja | media | alta | urgente
estimacion: ?            # en minutos, contra el presupuesto de 6 h
creada: 2026-09-23
actualizada: 2026-09-23
rama:                    # feat/... — vacío hasta empezar
pr:                      # URL del PR — vacío hasta abrirlo
tags: []
depende_de: []           # [TASK-002] — no empezar hasta que estén en done
bloqueada_por:           # si espera algo externo (una decisión del usuario), QUÉ
---

# TASK-000 · Título corto en una línea

<!-- ┌──────────────────────────────────────────────────────────────────────┐
     │ CÓMO USAR ESTA PLANTILLA                                             │
     │                                                                      │
     │ Copiala a docs/tasks/0-backlog/ como                                 │
     │   TASK-XXX-titulo-en-kebab-case.md                                   │
     │ numerada después de la última que exista en CUALQUIER carpeta.       │
     │                                                                      │
     │ Una tarea = una rama = un PR (ver CLAUDE.md § Tareas).               │
     │ El estado es la CARPETA donde vive el archivo:                       │
     │   0-backlog → 1-doing   al crear la rama                             │
     │   1-doing   → 2-testing al abrir el PR                               │
     │   2-testing → 3-done    cuando el usuario hace el merge              │
     │ El campo `estado` se actualiza de paso.                              │
     │                                                                      │
     │ Donde dice COMPLETAR va contenido real. Mientras quede uno, la       │
     │ tarea no pasa a 1-doing/. Antes de darla por escrita:                │
     │                                                                      │
     │   grep -c "^COMPLETAR" docs/tasks/0-backlog/TASK-XXX-*.md            │
     │   diff <(grep "^## " docs/tasks/_meta/TASK_TEMPLATE.md) \            │
     │        <(grep "^## " docs/tasks/0-backlog/TASK-XXX-*.md)             │
     │                                                                      │
     │ El segundo importa más: una sección AUSENTE no deja COMPLETAR.       │
     │                                                                      │
     │ Para un bug, usá BUG_TEMPLATE.md.                                    │
     └──────────────────────────────────────────────────────────────────────┘ -->

## Qué se espera

<!-- Una o dos frases, en lenguaje de negocio (Marta, Dani, la marca), de qué
     tiene que existir cuando la tarea esté terminada. QUÉ, no CÓMO. -->

COMPLETAR

## Contexto

<!-- Por qué existe. Qué decisión del plan la motiva (docs/PLAN.md § N). Qué
     alternativa ya se descartó y por qué: evita que el agente la vuelva a
     proponer. Enlazá tareas relacionadas. -->

COMPLETAR

## Criterios de aceptación

<!-- Lista verificable, con resultados observables. Si no se puede tildar,
     es un deseo, no un criterio.
       SÍ  - [ ] Logueado como Dani, GET /api/brands/hebra/replies responde 403
       NO  - [ ] Agregar requireMember en el route handler -->

COMPLETAR

## Fuera de alcance

<!-- Lo que esta tarea NO hace. Si algo de acá hace falta, es otra tarea en
     0-backlog/. Mantiene el PR legible en ~5 minutos. -->

COMPLETAR

## Aislamiento entre marcas

<!-- Qué puede filtrar datos entre marcas o entre especialistas en ESTA tarea,
     y cómo se evita. Checklist en docs/PLAN.md § 12. Si la tarea no toca
     datos, "(no aplica)" con el porqué. -->

COMPLETAR

## Cómo se valida

<!-- El recorrido a mano, numerado, con personas del seed concretas (Marta,
     Nuria, Dani, Leo, Sara) y datos concretos (VOL-48102, /brands/voltra).
     Arrancá con:  pnpm bootstrap && pnpm dev  → http://localhost:3000 -->

COMPLETAR

## Qué se testearía

<!-- Los tests no son obligatorios en este ejercicio (6 h). Igual se escribe
     qué se testearía primero y por qué, porque va a DECISIONS.md.
     Si se prueba algo con SQL (psql con el JWT de una persona) o curl, poné
     el comando: es el "test" de este proyecto. -->

COMPLETAR

## Verificación

<!-- Lo que tiene que estar en verde antes de abrir el PR:
       pnpm typecheck && pnpm lint && pnpm build
       pnpm db:reset          — si cambió el esquema o el seed
       el navegador            — si cambió la UI
       los subagentes          — code-reviewer siempre; tenant-isolation-reviewer
                                 y security-reviewer según CLAUDE.md -->

COMPLETAR

## Convenciones

<!-- Las reglas de CLAUDE.md que esta tarea toca de cerca. No copies todo:
     nombrá las que importan acá. Si la tarea AGREGA una regla, llevala a
     CLAUDE.md en el mismo PR. -->

COMPLETAR

## Skills a usar

<!-- Cuáles de la tabla de CLAUDE.md § Skills aplican. "(ninguna)" si no.
     Si la tarea tiene decisiones abiertas, correr /grill-me ANTES de empezar. -->

COMPLETAR

## Documentación a consultar

<!-- Qué verificar antes de escribir: Next 16 en node_modules/next/dist/docs/,
     el resto con Context7 y la versión instalada. Se completa al terminar con
     lo que efectivamente se consultó. -->

COMPLETAR

## Qué hacer

<!-- Lo propio de esta tarea. Lo general ya está en CLAUDE.md. -->

COMPLETAR

## Qué NO hacer

<!-- Trampas concretas de esta tarea, no reglas genéricas. -->

COMPLETAR

## Notas de implementación

<!-- Se llena MIENTRAS se trabaja: decisiones y por qué, bugs encontrados
     dentro del alcance (se arreglan acá y se anotan acá), qué salió de la
     review del usuario. Entradas con fecha, la más nueva arriba. -->

(vacío — no empezada)
