---
id: TASK-005
titulo: Mi feedback, la vista del especialista
estado: doing
prioridad: alta
estimacion: 90
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

- [x] `/me` como Dani lista solo sus respuestas reseñadas de Voltra y Boxwell, la más nueva arriba
- [x] Cada una muestra nota, etiquetas y comentario; las críticas en rojo (`text-bad`)
- [x] "Your average in Voltra" y "in Boxwell", con la cantidad de reseñas
- [x] Las etiquetas que más se repiten para Dani, por marca, con "last flagged"
- [x] Sus últimas 5 notas por marca, en orden, y "N critical"
- [x] No aparece ningún número calculado con respuestas de otra persona
- [x] Una marca que dejó sigue apareciendo como "Former brand"
- [x] La home le ofrece "See my feedback" a quien es especialista en alguna marca
- [x] La lista se pagina de a 20 ("21–40 of 312"); una página pasada del final ofrece volver, no da error
- [x] Buscar `VOL-48102` o "turn on" encuentra por ticket o asunto; caracteres raros no rompen la consulta
- [x] Filtrar por marca (solo las que cubre) y por etiqueta, desde las tarjetas; valores inválidos en la URL se ignoran
- [x] Las tarjetas salen de vistas SQL, no de la página visible

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

Server Components que leen de `server/data`. Colores semánticos solo para resultados y gravedad. Vistas con `security_invoker = on` y migración nueva (nunca editar una mergeada).

## Skills a usar

`frontend-design`, `accessibility`.

## Documentación a consultar

(ninguna nueva: reutiliza lo de TASK-003 y TASK-004)

## Qué hacer

- Migración `specialist_feedback_views` + `pnpm db:types`.
- `server/data/feedback.ts`.
- `app/me/page.tsx` y `features/feedback/`.

## Qué NO hacer

- No mostrar la media del equipo ni rankings.
- No calcular las medias sobre una consulta sin `specialist_id = user.id`: RLS solo no alcanza, porque a un lead le devuelve las respuestas de todo su equipo.
- No calcular las tarjetas sobre la página visible: con paginación, la media sería la de 20 filas.

## Notas de implementación

### 2026-09-25 · Revisión de los subagentes (ronda 3)
- `tenant-isolation-reviewer`: sin fugas. Probó las tres vistas con el JWT de las cinco personas, por SQL y por REST: cada especialista solo ve lo suyo, los leads el desglose de sus marcas (lo que necesita TASK-006), `anon` y cualquier escritura por la vista dan `permission denied`, y ninguna búsqueda armada con `cleanSearch` sale de su filtro. Arreglado: comentario en `reviewed_replies` que dice que es de solo lectura por grant (es auto-updatable). Para DECISIONS.md: `create index` sin `concurrently` bloquearía escrituras a volumen del importador; las vistas atan el tipo de las columnas que usan; el `array(...)` por fila de `reviewed_replies` se paga en la vista del lead.
- `code-reviewer`: sin hallazgos bloqueantes. Confirmó `or()`, `contains()`, `range()` y el conteo `head` contra el código de `postgrest-js`.

### 2026-09-25 · Ronda 3 del grill: volumen del helpdesk
El usuario pidió paginación y buscador: con el importador, un especialista va a tener miles de respuestas. Esto reemplaza Q1 y Q5.
- Q14: tres vistas `security_invoker` en una migración nueva: `reviewed_replies` (feed filtrable), `specialist_brand_scores` y `specialist_issue_counts`. No filtran por persona para que TASK-006 las reutilice por marca; `/me` agrega `specialist_id = user`. Las últimas 5 notas, una consulta chica por marca.
- Q15: búsqueda por ticket y asunto con `ilike`. Se limpian comillas, `\` y comodines antes de meterla en `or()`. Trigram, para DECISIONS.md como siguiente paso.
- Q16: filtros por marca (select) y por etiqueta (clic en la tarjeta), en la URL.
- Q17: Previous/Next de a 20 con `offset` y total. Cursor (keyset), para DECISIONS.md: con miles por persona `offset` alcanza.
- Índice `(specialist_id, sent_at desc)` reemplaza a `replies(specialist_id)`.
- Bug encontrado y arreglado: una página más allá del final hacía que PostgREST respondiera PGRST103 → error. Ahora cuenta y ofrece volver.
- Paginación probada en el navegador con tamaño de página 5 temporal (el seed tiene ≤ 12 por persona) y vuelta a 20.

### 2026-09-25 · Revisión de los subagentes
- `tenant-isolation-reviewer`: sin fugas. Verificó con SQL como cada persona (en transacciones con `rollback`) que `/me` solo agrega filas propias, incluso con rol mixto (Leo lead de Hebra) y al dejar una marca: la fila de `brands` llega `null` → "Former brand", y si ya no comparte marca con el lead → "Former lead". Deuda aplicada: `listMyFeedback()` toma el id de la sesión en vez de recibirlo por parámetro.
- `code-reviewer`: sin hallazgos bloqueantes. Arreglado: una marca dejada decía "Your average in Former brand"; ahora dice "Your average".
- Riesgo para DECISIONS.md: un exmiembro sigue viendo las reseñas nuevas sobre sus respuestas viejas. Es su propio trabajo, pero V2 debería decidir si se corta.

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
