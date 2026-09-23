---
id: TASK-004
titulo: Cola de revisión del lead y formulario de reseña
estado: backlog
prioridad: alta
estimacion: 60
creada: 2026-09-23
actualizada: 2026-09-23
rama:
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
2. Abrir VOL-48660 (el manillar flojo con devolución directa), poner 1, `skipped_procedure`, comentario, "Save and next". Vuelve a la lista con 3 reseñadas.
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

### 2026-09-23 · Decidido en el grill de TASK-003
- La reseña se guarda con una función `save_review(reply_id, score, comment, is_exemplar, issue_codes[])`, con `security invoker`, en una sola transacción. Deriva `brand_id` de `replies`; no lo recibe como parámetro. Las políticas y los grants vienen de TASK-003 (Q5, Q14).
- `/` con sesión puede redirigir según el rol (lead → `/review`); hasta ahora se queda en la página (Q11).
