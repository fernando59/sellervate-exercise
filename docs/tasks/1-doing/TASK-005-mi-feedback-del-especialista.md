---
id: TASK-005
titulo: Mi feedback, la vista del especialista
estado: doing
prioridad: alta
estimacion: 30
creada: 2026-09-23
actualizada: 2026-09-25
rama: feat/my-feedback
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
- [ ] Las etiquetas que más se repiten para Dani, por marca, con "last flagged"
- [ ] Sus últimas 5 notas por marca, en orden, y "N critical"
- [ ] No aparece ningún número calculado con respuestas de otra persona
- [ ] Una marca que dejó sigue apareciendo como "Former brand"
- [ ] La home le ofrece "See my feedback" a quien es especialista en alguna marca

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
- No calcular las medias sobre una consulta sin `specialist_id = user.id`: RLS solo no alcanza, porque a un lead le devuelve las respuestas de todo su equipo.

## Notas de implementación

### 2026-09-25 · Grill antes de empezar
- Q1: una sola consulta a `replies` con `specialist_id = user.id` (más RLS). Media y etiquetas se calculan en JS sobre esas mismas filas, las que se muestran. Sin migración; las vistas quedan para TASK-006, donde el agregado cruza especialistas.
- Q2: cada reseña cuenta en la media ("9 reviews", no "9 replies"), igual que la vista de TASK-006.
- Q3: "¿estoy mejorando?" = media + sus últimas 5 notas en secuencia. Una comparación antes/después con n de 3 a 9 por marca casi siempre quedaría oculta.
- Q4: top 3 etiquetas por marca, por gravedad y cantidad, con "last flagged <fecha>": responde "¿dejó de pasar?".
- Q5: tarjetas por marca arriba, una lista cronológica abajo con enlace a `/replies/[id]`. Sin filtro ni paginación.
- Q6: borde izquierdo `border-bad` en filas con etiqueta crítica y "N critical" en la tarjeta.
- Q7: CTA en la home; la navegación del header va con TASK-006.
- Q8: una marca que dejó aparece como "Former brand", no se oculta.
- Una marca que cubre sin reseñas muestra "No reviews yet".
- Recortado por tiempo (para DECISIONS.md): tira semanal por etiqueta, regla de la marca en la tarjeta, filtro por etiqueta, "What worked" con sus mejores respuestas, "nuevo desde tu última visita" (necesita `seen_at` y migración).

### 2026-09-23 · Aviso desde TASK-003 (tenant-isolation-reviewer)
- Un especialista que dejó una marca sigue viendo sus respuestas y reseñas de esa marca, pero ya no la fila de `brands`. En `/me`, un embed `brand:brands(...)` va a llegar como `null` aunque los tipos generados digan que no. Tratar ese caso (o mostrar el nombre de la marca desde otro lado).
