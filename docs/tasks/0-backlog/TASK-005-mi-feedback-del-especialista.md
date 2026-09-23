---
id: TASK-005
titulo: Mi feedback, la vista del especialista
estado: backlog
prioridad: alta
estimacion: 30
creada: 2026-09-23
actualizada: 2026-09-23
rama:
pr:
tags: [ui, feedback]
depende_de: [TASK-004]
bloqueada_por:
---

# TASK-005 · Mi feedback, la vista del especialista

## Qué se espera

Dani entra y ve sus respuestas reseñadas, con la nota, lo que falló y el comentario de Marta, lo crítico resaltado, y si está mejorando en cada marca. No ve nada de nadie más.

## Contexto

docs/PLAN.md § 4.3. "¿Estoy mejorando? ¿Qué me corrigen siempre?". Trampa de los agregados (§ 3): una "media del equipo" le filtra datos de otros especialistas aunque no tenga nombres. En V1 no se muestra.

## Criterios de aceptación

- [ ] `/me` como Dani lista solo sus respuestas reseñadas de Voltra y Boxwell, la más nueva arriba
- [ ] Cada una muestra nota, etiquetas y comentario; las críticas en rojo (`text-bad`)
- [ ] "Your average in Voltra" y "in Boxwell", con la cantidad de reseñas
- [ ] Las etiquetas que más se repiten para Dani
- [ ] No aparece ningún número calculado con respuestas de otra persona

## Fuera de alcance

Gráfico de tendencia (reutiliza el de TASK-006 si llega a tiempo). Responder o discutir una reseña (V2).

## Aislamiento entre marcas

Las consultas se apoyan en RLS (`specialist_id = auth.uid()`) y además filtran por el usuario actual en la consulta, no en el componente. Revisar que ningún agregado use una vista sin `security_invoker`.

## Cómo se valida

1. Como Dani, `/me`: VOL-48102 con nota 1 y `skipped_procedure` en rojo; VOL-48644 con nota 5.
2. Como Leo, `/me`: ninguna respuesta de Dani; aparece Hebra.
3. Como Marta, `/me`: estado vacío (no tiene respuestas propias), no un error.

## Qué se testearía

Que los agregados de `/me` den lo mismo que calcularlos a mano solo con las filas de esa persona.

## Verificación

`pnpm typecheck && pnpm lint && pnpm build`, el recorrido en el navegador, `code-reviewer` y `tenant-isolation-reviewer`.

## Convenciones

Server Components que leen de `server/data`. Colores semánticos solo para resultados y gravedad.

## Skills a usar

`frontend-design`, `accessibility`.

## Documentación a consultar

(ninguna nueva: reutiliza lo de TASK-003 y TASK-004)

## Qué hacer

- `server/data/feedback.ts`.
- `app/me/page.tsx` y `features/feedback/`.

## Qué NO hacer

- No mostrar la media del equipo ni rankings.
- No calcular las medias en JS sobre una lista que podría traer filas de otros.

## Notas de implementación

(vacío — no empezada)
