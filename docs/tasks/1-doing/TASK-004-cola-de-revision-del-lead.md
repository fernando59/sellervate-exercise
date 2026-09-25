---
id: TASK-004
titulo: Cola de revisión del lead y formulario de reseña
estado: doing
prioridad: alta
estimacion: 60
creada: 2026-09-23
actualizada: 2026-09-25
rama: feat/review-queue
pr:
tags: [ui, review, forms]
depende_de: [TASK-003]
bloqueada_por:
---

# TASK-004 · Cola de revisión del lead y formulario de reseña

## Qué se espera

Marta abre la herramienta, ve las respuestas que su equipo mandó ayer en sus marcas y, en cada una, deja una nota del 1 al 5, qué falló y un comentario, sin salir de la pantalla.

## Contexto

docs/PLAN.md § 4.1 y § 4.4. Es la lectura "Revisión", el núcleo. Las etiquetas se guardan como catálogo (no texto libre) para poder responder "¿vuelve a aparecer la misma etiqueta?". La gravedad vive en `issue_types` y nunca calcula la nota.

## Criterios de aceptación

- [ ] `/review` como Marta lista las respuestas de ayer de Voltra y Boxwell, con marca, ticket, especialista, asunto y nota si ya tiene
- [ ] Cabecera "Yesterday · N replies · M reviewed", con los números reales
- [ ] Filtro por marca y por "sin reseñar"
- [ ] El panel derecho muestra la regla principal de la marca, el tiempo de respuesta calculado, el mensaje del cliente y la respuesta, visualmente distintos
- [ ] Nota 1–5 con botones grandes, etiquetas agrupadas por gravedad, comentario y "Save and next"
- [ ] Guardar de nuevo edita la reseña (una por respuesta y revisor)
- [ ] Una nota fuera de 1–5 enviada a mano a la action es rechazada en el servidor
- [ ] `/replies/[id]` muestra respuesta, reglas completas de la marca y la reseña; lo ven el lead y el autor, nadie más
- [ ] Atajos `1`–`5` y `J`/`K` (recortable)

## Fuera de alcance

Vista del especialista (TASK-005), página de marca (TASK-006), estados de carga y error diseñados (TASK-007), `is_exemplar` en la UI.

## Aislamiento entre marcas

La action sigue el orden `getCurrentUser → parse → cargar la respuesta (RLS) → requireLeadOf(reply.brand_id) → escribir`. `brand_id` sale de la fila, nunca del formulario. Logueado como Nuria, mandar a mano el id de una respuesta de Voltra tiene que fallar.

## Cómo se valida

1. Como Marta, `/review`: 7 respuestas de ayer, 2 reseñadas.
2. Abrir VOL-48660 (el manillar flojo con devolución directa), poner 1, `skipped_procedure`, comentario, "Save and next". Pasa a la siguiente sin reseñar y la cabecera dice 3 reseñadas.
3. Como Nuria, `/review`: solo Hebra.
4. Como Dani, `/replies/<id de VOL-48644>`: la ve. `/replies/<id de HB-7921>`: 404.

## Qué se testearía

El schema zod (nota fuera de rango, etiquetas inexistentes) y la action con un lead de otra marca. Primero la action: es la frontera de seguridad.

## Verificación

`pnpm typecheck && pnpm lint && pnpm build`, el recorrido en el navegador, `code-reviewer` y `tenant-isolation-reviewer`.

## Convenciones

RHF + zod con `review-form.config.ts` compartido; la action vuelve a correr `parse`; `startTransition`, `Controller`, `setValue` para los atajos. Solo clases de token. Textos en inglés.

## Skills a usar

`react-hook-form-zod`, `rhf-form-config`, `frontend-design`, `accessibility`.

## Documentación a consultar

Next 16 server actions y `revalidatePath`; react-hook-form 7 y `@hookform/resolvers` 5 con zod 4, vía Context7.

## Qué hacer

- Instalar `zod`, `react-hook-form`, `@hookform/resolvers`.
- `server/data/replies.ts` y `server/data/reviews.ts`.
- `features/review/` con la action, el config y los componentes.
- `updated_at` lo pone la action al editar.

## Qué NO hacer

- No calcular la nota a partir de las etiquetas, ni sugerirla.
- No aceptar `brand_id` ni `reviewer_id` en el input.
- No guardar etiquetas como texto libre.

## Notas de implementación

### 2026-09-25 · Grill de TASK-004
- Q1 "Ayer" = día calendario en `APP_TIME_ZONE = "Europe/Madrid"`, aislado en `server/time.ts` (`yesterdayRange()`). No escala a equipos en varios husos: lo correcto sería `brands.time_zone` (el día pertenece a la marca). Va a DECISIONS.md como "qué se rompe al crecer".
- Q2 Solo ayer; no se elige otro día. Q22 Orden por `sent_at` ascendente, marcas mezcladas. Q23 Por defecto se ven todas; "Unreviewed" a un clic.
- Q3 Estado en `searchParams` (`brand`, `status`, `reply`), render en el servidor. Un `reply` fuera de la cola → `notFound()`. Q13 Quien no lidera ninguna marca ve un estado vacío (200); un `?brand=` ajeno se ignora.
- Q4 Móvil: lista o detalle ("← Queue"); desde `lg:`, dos columnas.
- Q5 "Save and next" va a la siguiente sin reseñar por mí (da la vuelta); si no queda ninguna, "All caught up". Q7 "M reviewed" cuenta mis reseñas.
- Q6 Si ya reseñé, formulario relleno y "Update and next". La reseña de otro lead no se muestra (calibración, V2).
- Q8 `save_review(reply_id, score, comment, issue_codes[])`, sin `is_exemplar` (sin UI; mandarlo pisaría un `true`). Q15 Upsert por `(reply_id, reviewer_id)`, etiquetas reemplazadas por diferencia, devuelve el id. Q16 Chequeos explícitos en la función: `P0002` respuesta no visible, `42501` no es lead, `22023` etiqueta inválida o crítica con nota > 2.
- Q9 Solo etiquetas activas; la función rechaza las inactivas. Editar una reseña con una etiqueta ya retirada: se deja pasar.
- Q10 Comentario opcional, `trim`, ≤ 2000. La columna es `not null default ''`, así que vacío se guarda como `''` (no `null`).
- Q11 Un solo PR, con `/replies/[id]`. Q20 `/replies/[id]` es solo lectura, con enlace a la cola si la respuesta es de ayer.
- Q12 Atajos `1`–`5`, `J`/`K`, ignorados dentro del textarea; se recortan si pasamos los 60 min.
- Q14 Tiempo de respuesta neutro, en mono (`2 h 20 min`).
- Q17 La action devuelve `{ ok: true, nextReplyId } | { ok: false, error, fieldErrors? }`; el cliente hace `router.push`. Q21 `revalidatePath` de `/review` y `/replies/[id]`.
- Q18 "Crítica ⇒ ≤ 2" es un error del `refine` sobre la nota; no se deshabilitan botones (la UI no sugiere notas). Q19 Chips por gravedad: `bad` / `warn` / neutro.

### 2026-09-23 · Decidido en el grill de TASK-003
- La reseña se guarda con una función `save_review(reply_id, score, comment, is_exemplar, issue_codes[])`, con `security invoker`, en una sola transacción. Deriva `brand_id` de `replies`; no lo recibe como parámetro. Las políticas y los grants vienen de TASK-003 (Q5, Q14).
- Regla "etiqueta crítica ⇒ nota ≤ 2": `refine` en el schema compartido y chequeo dentro de `save_review` (Q16).
- Una respuesta de una marca ajena en una página → `notFound()`, no 403 (Q17).
- `/` con sesión puede redirigir según el rol (lead → `/review`); hasta ahora se queda en la página (Q11).
