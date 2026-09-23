---
id: TASK-006
titulo: Página de marca con tendencia semanal y problemas frecuentes
estado: backlog
prioridad: media
estimacion: 45
creada: 2026-09-23
actualizada: 2026-09-23
rama:
pr:
tags: [ui, chart, db]
depende_de: [TASK-004]
bloqueada_por:
---

# TASK-006 · Página de marca con tendencia semanal y problemas frecuentes

## Qué se espera

Cuando la marca pregunta "¿están mejorando?", Marta abre Voltra y muestra el número: la nota semanal, qué falla más y qué se cambió.

## Contexto

docs/PLAN.md § 4.2 y § 8. Es la lectura "Prueba" en versión mínima: un `GROUP BY` sobre las mismas reseñas. La fecha es `replies.sent_at` (cuándo se hizo el trabajo), no cuándo revisó Marta. Recharts como componente cliente que recibe datos serializados.

## Criterios de aceptación

- [ ] `/brands/voltra` como Marta: tendencia de 8 semanas, eje Y fijo 1–5
- [ ] Las semanas sin reseñas son un hueco, no un cero; los puntos con n < 3 se ven atenuados
- [ ] Tooltip "4.1 · 12 reviews · 0 critical"
- [ ] El evento "Diagnostic checklist..." aparece como línea vertical (recortable)
- [ ] Problemas más frecuentes ordenados por gravedad
- [ ] Tabla por especialista: media, cantidad, críticos (recortable)
- [ ] Como Nuria, `/brands/voltra` responde 404/403, no una página vacía

## Fuera de alcance

Exportar, PDF, comparar marcas, vista materializada.

## Aislamiento entre marcas

Las vistas llevan `security_invoker = on`: sin eso se ejecutan como su dueño y se saltan RLS, y un especialista vería la media de todo el equipo. Página dinámica, sin caché compartida entre usuarios.

## Cómo se valida

1. Como Marta, `/brands/voltra`: la media baja de ~2,6 a ~4,5 después de la línea del checklist.
2. Como Dani, llamar la misma vista por PostgREST con su JWT: solo agrega sus propias respuestas.
3. Como Nuria, `/brands/voltra` → no autorizado.

## Qué se testearía

La vista con el JWT de un especialista: que su media sea la de sus respuestas y no la de la marca.

## Verificación

`pnpm typecheck && pnpm lint && pnpm build`, `pnpm db:reset`, `pnpm db:types`, el navegador, `code-reviewer` y `tenant-isolation-reviewer`.

## Convenciones

Vistas SQL para los agregados. Colores del gráfico desde variables CSS. Recharts solo en un componente `'use client'`.

## Skills a usar

`dataviz`, `supabase-postgres-best-practices`, `frontend-design`.

## Documentación a consultar

Recharts 3 (`LineChart`, `ReferenceLine`, `connectNulls`) vía Context7; Next 16 sobre caché y rendering dinámico.

## Qué hacer

- Instalar `recharts` y `react-is`.
- Migración con `brand_weekly_scores` y la de problemas frecuentes, `security_invoker = on`.
- `server/data/trends.ts` con `fillMissingWeeks`.

## Qué NO hacer

- No usar `reviews.created_at` como fecha del gráfico.
- No rellenar semanas vacías con 0.
- No `unstable_cache` ni `"use cache"` sin el usuario en la clave.

## Notas de implementación

(vacío — no empezada)
