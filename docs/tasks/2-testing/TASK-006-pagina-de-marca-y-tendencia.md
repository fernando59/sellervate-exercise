---
id: TASK-006
titulo: Página de marca con tendencia semanal y problemas frecuentes
estado: testing
prioridad: media
estimacion: 60
creada: 2026-09-23
actualizada: 2026-09-25
rama: feat/brand-overview
pr: https://github.com/fernando59/sellervate-exercise/pull/7
tags: [ui, chart, db, seed]
depende_de: [TASK-004, TASK-005]
bloqueada_por:
---

# TASK-006 · Página de marca con tendencia semanal y problemas frecuentes

## Qué se espera

Cuando la marca pregunta "¿están mejorando?", Marta abre Voltra y muestra el número: la nota semanal, qué falla más, quién necesita atención y qué se cambió.

## Contexto

docs/PLAN.md § 4.2 y § 8. Es la lectura "Prueba" en versión mínima: un `GROUP BY` sobre las mismas reseñas. La fecha es `replies.sent_at` (cuándo se hizo el trabajo), no cuándo revisó Marta. Recharts como componente cliente que recibe datos serializados.

TASK-005 ya creó `specialist_brand_scores` y `specialist_issue_counts` (`security_invoker = on`). La tabla por especialista y los problemas frecuentes las leen filtrando por `brand_id`; solo falta la vista semanal.

Descartado en el grill: abrir la página al especialista con sus datos (su tendencia ya está en `/me`), la diferencia "últimas 4 vs. 4 anteriores" (con n chico aparenta precisión) y bajar el umbral de atenuación para que el demo se vea bien (se agregan reseñas al seed).

## Criterios de aceptación

- [ ] Como Marta, `/brands/voltra`: tendencia de 8 semanas (incluida la semana en curso, marcada "so far"), eje Y fijo 1–5
- [ ] Las semanas sin reseñas son un hueco, no un cero; los puntos con n < 3 se ven atenuados
- [ ] Tooltip "4.1 · 12 reviews · 0 critical" (críticas = reseñas con al menos una etiqueta crítica)
- [ ] Resumen arriba: media de las 8 semanas, reseñas y críticas
- [ ] El evento "Diagnostic checklist..." aparece como línea vertical en su semana, con la nota completa debajo del gráfico (recortable)
- [ ] Problemas frecuentes, "All time", ordenados por gravedad y cantidad, con "last flagged <fecha>"
- [ ] Tabla por especialista, "All time": media, reseñas, críticas; ordenada por críticas desc y media asc (recortable)
- [ ] Como Nuria y como Dani, `/brands/voltra` responde 404; `/brands/no-existe` también
- [ ] Una marca sin reseñas muestra un `EmptyState` con link a `/review`
- [ ] El home enlaza a la página de cada marca que lidera, la franja de marca en `/review` también, y la cabecera tiene navegación según el rol
- [ ] Sin scroll horizontal a 320, 375, 768 y 1280 px; la tabla por especialista se apila en el móvil
- [ ] El gráfico tiene una tabla `sr-only` equivalente y el SVG va con `aria-hidden`

## Fuera de alcance

Exportar, PDF, comparar marcas, vista materializada, "últimas reseñas" (Q9), marca "Former" para especialistas que dejaron la marca (Q10), zona horaria por marca (Q4), el pulido de estados de carga y error (TASK-007).

## Aislamiento entre marcas

- Las vistas llevan `security_invoker = on`: sin eso se ejecutan como su dueño y se saltan RLS, y un especialista vería la media de todo el equipo.
- La página exige ser lead de la marca en el servidor (membresía cargada de la base, el `slug` solo busca). Si no lo es, `notFound()`: no revela si la marca existe.
- Aunque la página no le sirve a Dani, la vista semanal por PostgREST con su JWT tiene que agregar solo sus respuestas.
- Página dinámica, sin caché compartida entre usuarios.

## Cómo se valida

`pnpm bootstrap && pnpm dev` → http://localhost:3000

1. Como Marta, home → tarjeta Voltra → `/brands/voltra`: la media sube de ~2,5 a ~4,3 después de la línea del checklist; la semana en curso se ve atenuada.
2. Tooltip de una semana: "x.x · n reviews · n critical".
3. Problemas frecuentes: `skipped_procedure` y `wrong_info` arriba, con su última fecha.
4. Tabla por especialista: Dani primero (más críticas).
5. Como Marta, `/review` → franja de Voltra → enlace a la página de la marca.
6. Como Nuria, `/brands/voltra` → 404. Como Dani, `/brands/voltra` → 404.
7. Con el JWT de Dani, `GET /rest/v1/brand_weekly_scores?brand_id=eq.<voltra>`: n suma solo sus reseñas.

## Qué se testearía

La vista con el JWT de un especialista: que su media sea la de sus respuestas y no la de la marca. Con psql:

```sql
set local role authenticated;
set local request.jwt.claims = '{"sub":"<id de Dani>","role":"authenticated"}';
select week, avg_score, reviews from public.brand_weekly_scores where brand_id = '<voltra>';
```

## Verificación

`pnpm typecheck && pnpm lint && pnpm build`, `pnpm db:reset`, `pnpm db:types`, el navegador a 320/375/768/1280, `code-reviewer` y `tenant-isolation-reviewer` (y `security-reviewer` porque entra una dependencia nueva).

## Convenciones

Vistas SQL para los agregados, en una migración nueva. Colores del gráfico desde variables CSS. Recharts solo en un componente `'use client'`. `recharts` y `react-is` con versión exacta, en este PR. Tablas apiladas en el móvil.

## Skills a usar

`dataviz`, `supabase-postgres-best-practices`, `frontend-design`, `accessibility`.

## Documentación a consultar

Recharts 3 (`LineChart`, `ReferenceLine`, `connectNulls`, `ResponsiveContainer` o `responsive`) vía Context7 con la versión instalada; Next 16 sobre `notFound()` y rendering dinámico en `node_modules/next/dist/docs/`.

## Qué hacer

- Instalar `recharts@3.10.1` y `react-is@19.2.x` (alineado con `react`).
- Migración con `brand_weekly_scores` (semana UTC por `sent_at`, avg, n, críticas), `security_invoker = on`, solo `select` para `authenticated`.
- `server/data/trends.ts` con `fillMissingWeeks` (semanas vacías = `null`).
- `server/data/brands.ts` (o similar): marca por slug + lead check; problemas frecuentes y tabla por especialista desde las vistas de TASK-005.
- `app/brands/[slug]/page.tsx` + componentes en `features/brand-overview/`.
- Seed: ~10 reseñas nuevas en Voltra y Boxwell (Q13).
- Links desde el home y desde la franja de marca de `/review`.

## Qué NO hacer

- No usar `reviews.created_at` como fecha del gráfico.
- No rellenar semanas vacías con 0.
- No `unstable_cache` ni `"use cache"` sin el usuario en la clave.
- No tomar `brand_id` de la URL como autorización: la membresía sale de la base.
- No mostrar al especialista agregados del equipo.

## Notas de implementación

### 2026-09-25 · Revisión de los subagentes
- `tenant-isolation-reviewer`: sin fugas. Probó `brand_weekly_scores`, `specialist_brand_scores`, `brand_events`, `profiles` y `brands` con el JWT de las cinco personas. Dani 13 + Leo 10 = los 23 de Voltra que ve Marta; Nuria no ve nada de Voltra ni de Boxwell; `anon` recibe `permission denied`.
  - Arreglado (R2): la regla "lead de esta marca" estaba repetida a mano en la página. Ahora es `findLedBrand` en `server/auth/session.ts`.
  - Se deja (R1): las funciones de `brand-overview.ts` confían en que las llame un lead. No filtran datos (RLS limita a un especialista a lo suyo), pero los títulos mentirían si otra página las reutilizara.
  - Para DECISIONS.md: `Europe/Madrid` está escrito en SQL y en TS; el filtro por `week` se aplica después de agrupar todo el historial de la marca, y es lo primero que se rompe con volumen.
- `security-reviewer`: sin vulnerabilidades. Ninguna dependencia nueva tiene scripts de instalación, y las versiones son exactas. No tenía red para `pnpm audit`; lo corrió el agente: `pnpm audit --prod` → "No known vulnerabilities found".
- `code-reviewer`: sin bloqueantes. Confirmó que la semana de la vista y la de `recentWeekStarts` coinciden.
  - Su hallazgo 1 (la navegación contradice "Fuera de alcance") ya estaba corregido en el archivo de la tarea; leyó la versión anterior.
  - Arreglado (2): con una marca sin reseñas, un `brand_event` quedaba invisible, porque el `EmptyState` reemplazaba toda la sección. Ahora "What changed" se muestra debajo del estado vacío. Se verificó en el navegador con una marca temporal (Marta como lead y un evento de hoy) y después se restauró la base con `pnpm db:reset`.
  - Se deja (3): "Former specialist" cuando RLS oculta el perfil, igual que en `server/data/replies.ts`.

### 2026-09-25 · Implementación
- **Q4 corregida: semanas en Europe/Madrid, no en UTC.** Al implementar apareció `APP_TIME_ZONE` en `server/time.ts`, la zona en que la app ya mide "ayer". Con semanas en UTC, una respuesta del lunes 00:30 en Madrid caería en la semana anterior. La vista trunca `sent_at at time zone 'Europe/Madrid'` (pasando por un timestamp local: truncar el `timestamptz` y castear a `date` leería la medianoche de Madrid en UTC y daría domingo), y `recentWeekStarts` calcula los mismos lunes en JS.
- **Q8 cambiada por el usuario a (b):** navegación en la cabecera, porque TASK-005 (Q7) ya la había prometido para esta tarea. Enlaces según el rol, armados en el servidor: "Review queue" y una entrada por marca que lidera (lead), "My feedback" (especialista). En móvil, una segunda fila; desde `md:`, en línea.
- Home: la lista de marcas existente tiene un enlace "Overview" en las que lidera, en lugar de tarjetas nuevas. La franja de marca de `/review` enlaza a la página; la de `/replies/[id]` no, porque la ve el especialista.
- Todo el acceso a datos está en `server/data/brand-overview.ts`, en vez de `trends.ts`: son cuatro lecturas de la misma página.
- Seed: 10 respuestas nuevas y 14 reseñas nuevas (4 de ellas sobre respuestas viejas sin reseñar), 55 respuestas y 46 reseñas en total. Voltra: ~2,6 antes del checklist y ~4,4 después. Boxwell: casi todas las semanas con n = 3. README y cabecera de `seed.sql` actualizados.
- Verificado en el navegador (`next start`): 320, 375, 768 y 1280 px sin scroll horizontal. Tooltip "3.3 · 3 reviews · 0 critical". Marta: `/brands/voltra` da 200. Nuria y Dani: `/brands/voltra` da 404; `/brands/nope` da 404 para los tres. Con psql y el JWT de Dani, la vista suma 13 reseñas con media 2,77, las suyas; Nuria obtiene 0 filas en Voltra y `anon` recibe `permission denied`.
- Arreglado durante la verificación: los puntos en 1 y en 5 quedaban cortados en el borde. Se resolvió con `padding` en el eje Y, sin tocar el dominio 1–5.

### 2026-09-25 · Grill antes de empezar
- Q1: solo el lead de la marca. Los demás (Nuria, y también Dani como especialista de Voltra) reciben `notFound()`, como `/review` y `/replies/[id]`. El especialista tiene su tendencia en `/me`; el 403 lo da la API.
- Q2: en la base local cada semana tiene n de 1 a 3 por marca, así que con "atenuar si n < 3" casi todo quedaba atenuado. Se mantiene el umbral y se agregan reseñas al seed; bajar el umbral para el demo sería hacer trampa con la regla.
- Q3: 8 semanas, incluida la semana en curso marcada "so far"; con n chico la atenuación ya la señala.
- Q4: semanas en UTC. (Corregida al implementar: Europe/Madrid; ver Implementación.)
- Q5: problemas frecuentes y tabla por especialista son "All time" desde las vistas de TASK-005, sin SQL nuevo. Problemas por gravedad y cantidad, con "last flagged".
- Q6: "critical" cuenta reseñas con al menos una etiqueta crítica, igual que `specialist_brand_scores`.
- Q7: `brand_events` entra: `ReferenceLine` en el lunes de su semana, etiqueta corta y la nota completa debajo. Primero en recortarse.
- Q8: links desde el home y desde la franja de marca en `/review`. (Cambiada después a (b): también navegación en la cabecera; ver Implementación.)
- Q9: "últimas reseñas" se recorta (ya están en `/review` filtrando por marca) → Status.
- Q10: un especialista que dejó la marca aparece con su nombre, sin distinción (RLS lo permite vía `authored_reply_in_led_brand`). Marca "Former" → V2.
- Q11: tabla ordenada por críticas desc y media asc: quién necesita atención primero, no un ranking.
- Q12: resumen = media de 8 semanas · reseñas · críticas. Sin diferencia 4 vs. 4.
- Q13: seed: Voltra antes del checklist con ≥3 reseñas por semana, notas 2–3 y `skipped_procedure`/`wrong_info` (sobre todo Dani); después 4–5. Boxwell plano 3–4, con las `no_order_check` de Sara al principio. Hebra sin cambios. La semana en curso queda con n < 3 a propósito. Revisar que `/me` siga bien con los números nuevos.
- Q14: móvil: gráfico a ancho completo ~220 px, fechas cortas; especialistas en tarjetas y tabla desde `sm:`; problemas como lista; en `lg:` problemas y especialistas lado a lado.
- Q15: tabla `sr-only` con los datos del gráfico y `aria-hidden` en el SVG.
- Q16: marca sin reseñas → `EmptyState` con link a `/review`.
