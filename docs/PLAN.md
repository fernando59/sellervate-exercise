# Plan de trabajo

Plan del ejercicio técnico de Sellervate. Todo lo que está acá **ya fue decidido**: el agente lo toma como punto de partida y no lo vuelve a discutir. Si una decisión cambia, se actualiza este archivo en el mismo PR y se explica el porqué en la descripción del PR.

Versión visual con diagramas: [`ai-logs/01-analisis-plan.html`](../ai-logs/01-analisis-plan.html). Conversación completa del análisis: [`ai-logs/01-analisis.md`](../ai-logs/01-analisis.md).

---

## 1. El enunciado, resumido

### Contexto de negocio
**Sellervate** gestiona la atención al cliente de marcas de ecommerce **haciéndose pasar por la marca**: el cliente final cree que le escribe la empresa de patinetes, pero le responde un especialista de Sellervate, con la voz de esa marca, siguiendo sus procedimientos y desde su helpdesk. El cliente nunca sabe que Sellervate existe.

- Cada especialista cubre **2 o 3 marcas por día**, y cada marca define distinto qué es una buena respuesta:
  - **Marca técnica** (patinetes): diagnosticar antes de ofrecer una devolución, porque la mitad de las quejas son de gente que usa mal el producto.
  - **Marca commodity** (packaging): rápido, exacto, tres líneas.
  - El mismo párrafo puede ser excelente para una marca y pésimo para la otra.
- La calidad de las respuestas **es el producto**: es lo único de Sellervate que ve el cliente.

### El problema
Hoy el team lead abre el inbox compartido, lee por encima lo que salió ayer y avisa por Slack si algo se ve mal. Eso:
- deja de funcionar a partir de la cuarta marca,
- **no deja registro**, así que no sirve para coaching,
- no permite responderle a una marca que pregunta si están mejorando,
- detecta los errores tarde: un especialista cerró tickets sin revisar el historial de pedidos durante un mes, y **lo descubrió la marca**.

### Qué hay que construir
Una **herramienta interna** donde el **team lead deja registrado su juicio sobre respuestas que ya se enviaron** y el **especialista lo lee**. Con el tiempo, ese registro se convierte en tendencia (para la marca) y en ejemplos (para el onboarding).

**Lo que NO es:** no es un helpdesk, ni un inbox, ni un sistema de tickets; dentro de la herramienta nadie habla con clientes. Tampoco es un producto de IA: **nada de scoring automático**. Si un modelo encaja en algún lado, se describe en un párrafo en DECISIONS.md y no se implementa.

### El escenario de referencia
- **Marta** (lead de 3 marcas) abre la herramienta y ve las ~30 respuestas que su equipo envió ayer. Lee 5, y en cada una registra qué tan buena fue y qué falló: lenta, tono equivocado para la marca, respondió otra pregunta, correcta pero no va a evitar que el cliente vuelva a escribir.
- Dos semanas después, la marca pregunta cómo van. Marta abre la marca y muestra **la tendencia, lo que se repite mal y lo que se cambió**.
- **Dani** (especialista) entra y ve **sus propias notas** y los comentarios de Marta. No ve las de nadie más.

### Notas de la reunión (el único brief)
- "En tres respuestas sé si alguien leyó los procedimientos de la marca. Pero leo unas cinco por día y enviamos cientos."
- Patinetes: diagnosticar antes de ofrecer una devolución. Packaging: rápido y exacto. Misma persona, trabajo completamente distinto.
- "Equivocarse un poco de tono es molesto. Decirle al cliente algo incorrecto sobre su propio producto es como perdemos la cuenta."
- Un especialista cerró tickets sin revisar el historial de pedidos durante un mes. Se enteraron porque se enteró la marca.
- La mayoría de los especialistas cubre 2 o 3 marcas. Marta cubre 4 de las 6 y Nuria el resto, así que ninguna ve el panorama completo.
- El especialista ve sus notas y lo que escribió el lead, no las de los demás.
- Cuando entra alguien nuevo, le muestran respuestas buenas y malas y le explican la diferencia. Hoy eso significa buscar en el inbox la noche anterior.
- "Cada trimestre le digo a una marca que estamos mejorando. Preferiría mostrarle el número."
- "Algún día esto debería traer las respuestas del helpdesk por sí solo. No ahora. Pero no lo hagan imposible."

### Reglas duras
| Regla | Detalle |
|---|---|
| Tiempo | **6 h de trabajo real, corte duro**, repartidas en 1 semana. Se anotan en `docs/TIMELOG.md` y en el README. Pasarse cuenta en contra ("no sabe acotar"). |
| Stack | Monorepo **público** en GitHub; Next.js App Router + TypeScript; **Supabase Postgres** (no se puede cambiar); Tailwind (daisyUI opcional). |
| Login | **Se puede simular** (selector de usuario en una esquina). |
| Autorización | **No se puede simular.** Se aplica en el servidor. Si cambian a especialista y piden por API datos de otra marca, la API tiene que responder que no. Ocultar un botón no cuenta. |
| Seed | Inventado: **≥2 marcas, ≥3 especialistas, ≥2 leads**, suficientes notas para que un promedio tenga sentido. Respuestas creíbles (nada de lorem ipsum), marcas que suenen claramente distintas y al menos una respuesta claramente mala. |
| Flujo Git | Rama por tarea → el agente escribe el código y abre el PR → **review escrita del usuario en el PR** → correcciones en la misma rama → merge. **Sin squash, sin rebase, sin un PR gigante al final.** Con 4 o 5 PRs reales alcanza. |
| Diseño | Importa mucho. Referencia: sellervate.com, sin copiarla. Escala tipográfica elegida, sistema de color explicable, estados vacío, de carga y de error diseñados. |
| README | Del clone a la app corriendo en menos de 10 minutos, seed, cómo cambiar de rol y horas reales. Si hubo starter, nombrarlo. |
| Tests | No son obligatorios. Una línea en DECISIONS.md sobre qué se testearía primero y por qué no se hizo. |
| Logs de IA | Si hay logs de sesión o archivos de prompts, se commitean (`ai-logs/`). |

### Entregables
1. Repo público con ramas y PRs intactos: https://github.com/fernando59/sellervate-exercise
2. `README.md`.
3. `docs/DECISIONS.md`, de **2 páginas como máximo**, con cuatro secciones:
   - **Product**: el problema real, qué se construyó primero, qué se dejó fuera, dónde encajaría un modelo y qué preguntaríamos antes de una V2.
   - **Architecture**: la forma elegida, el modelo de datos, dónde se aplica la autorización, qué haría falta para auth real y qué se rompe primero al crecer.
   - **AI**: cómo se trabajó, dónde acertó el agente y dónde se lo corrigió, y un prompt pegado tal cual.
   - **Status**: qué está terminado, qué a medias y qué sin tocar, en orden de prioridad; y **lo que más criticaríamos si fuera el PR de otro**, y por qué se dejó.
4. Link del repo y horas reales en el texto de la propuesta de Upwork.

Después, si pasa el filtro, hay una entrevista de 45 minutos sin live coding: repasan las decisiones, **dos cosas que se recortaron**, un PR en detalle y cómo se usan estas herramientas en el día a día.

### Cómo puntúan
| Dimensión | Peso |
|---|---|
| **Cómo trabajaste (PRs y reviews)** | **24** |
| Interpretación del problema y priorización | 18 |
| Arquitectura y código | 13 |
| Modelo de datos | 12 |
| Seguridad y aislamiento por tenant | 10 |
| Interfaz y calidad visual | 10 |
| DECISIONS.md | 8 |
| Terreno cubierto en 6 h | 5 |

El 42 % es proceso e interpretación, no código. Lo que más pesa es que se note que el usuario **lee lo que le entrega el agente**. En las reviews buscan específicamente que se detecte:
- **la fuga de datos entre tenants**,
- **la migración que en 3 meses no se va a poder correr**,
- **lo que no vale la pena discutir**.

---

## 2. Lectura del problema (decidida)

El enunciado propone tres lecturas válidas y pide elegir una:

| Lectura | Qué se construye | Decisión |
|---|---|---|
| **Revisión** | El ciclo: calificar rápido y de forma consistente. | **Núcleo: se construye bien.** |
| **Prueba** | Tendencia y evidencia para mostrarle a la marca. | **Versión mínima**: es un `GROUP BY` sobre las mismas reseñas. |
| **Coaching** | Biblioteca de ejemplos buenos y malos con su razonamiento. | **Fuera.** Solo el flag `is_exemplar` en `reviews`. |

**Por qué:** sin reseñas guardadas no existen ni la tendencia ni la biblioteca; las dos son consultas sobre la misma tabla. Construir bien la reseña habilita las otras dos lecturas casi gratis.

### Qué queda fuera, y por qué (para DECISIONS.md)
- **Login real**: el enunciado permite simularlo y no aporta señal.
- **Importación del helpdesk**: "ahora no". El modelo lo deja preparado con `source` + `external_id`.
- **Scoring con IA**: el enunciado dice explícitamente que es construir bien lo equivocado.
- **Calibración entre leads, notificaciones, exportes y PDF**: V2.
- **Biblioteca de coaching**: solo el flag.
- **Que el especialista responda o discuta una reseña**: V2.

### Supuestos (escribirlos en DECISIONS.md)
- Una reseña por respuesta y por revisor.
- El tiempo de respuesta se **calcula** (`sent_at − received_at`); el lead no lo juzga.
- El catálogo de etiquetas de problema es **global** y cada etiqueta tiene una gravedad fija. Las marcas no lo personalizan en V1.
- El especialista ve solo sus propias respuestas reseñadas, en todas sus marcas.
- El lead ve todo lo de las marcas que lidera y nada de las demás.
- Las respuestas que se evalúan ya se enviaron: la herramienta no las edita.

### El ciclo, explicado
1. El especialista responde en el helpdesk de la marca (fuera de la herramienta).
2. Al día siguiente, el lead ve la cola de respuestas de ayer de sus marcas, lee unas 5 y en cada una registra:
   - una **nota del 1 al 5**,
   - **qué falló**, como etiquetas con gravedad,
   - un **comentario o recomendación**, por ejemplo: "En Voltra, 'no enciende' suele ser el bloqueo de batería. Antes de ofrecer el cambio, pedirle que mantenga pulsado 10 s."
3. El especialista ve sus respuestas reseñadas, con la nota, las etiquetas y el comentario.
4. El registro sirve a cuatro públicos:

| Quién | Pregunta que responde |
|---|---|
| Especialista (Dani) | ¿Estoy mejorando? ¿Qué me corrigen siempre? |
| Lead (Marta) | ¿Dani dejó de ofrecer devoluciones sin diagnosticar después de que se lo marqué? ¿Quién cierra tickets sin mirar el pedido? |
| Marca (cliente de Sellervate) | ¿Están mejorando? → la tendencia, lo que fallaba y lo que se cambió. |
| Onboarding | Ejemplos buenos y malos y por qué (V2). |

"¿Hace caso a las correcciones?" se responde viendo si **la misma etiqueta** vuelve a aparecer después de que se la marcaron. Por eso "qué falló" se guarda como **etiquetas**, no solo como texto libre.

### Gravedad de las etiquetas
Sale de la nota "el tono molesta; la información incorrecta hace perder la cuenta". **La gravedad mide el daño a la relación con la marca**, no qué tan mal escrita está la respuesta.

| Gravedad | Criterio | Etiquetas (`code` · texto) |
|---|---|---|
| `critical` | Puede costar la cuenta o dañar al cliente | `wrong_info` · Información incorrecta sobre el producto o la política · `no_order_check` · No revisó el historial del pedido · `skipped_procedure` · Se saltó un procedimiento obligatorio de la marca (p. ej. devolución sin diagnóstico en Voltra) |
| `major` | El problema no se resuelve y el cliente vuelve a escribir | `wrong_question` · Respondió otra pregunta · `incomplete` · Correcta pero incompleta, el cliente va a volver a escribir |
| `minor` | Molesta, pero no rompe nada | `tone` · Tono equivocado para la marca · `length` · Largo inadecuado para la marca · `slow` · Respuesta lenta |

- La gravedad vive en el **catálogo** (`issue_types.severity`); el lead no la elige cada vez. Así las evaluaciones son consistentes entre leads.
- **Nunca calcula la nota.** La nota es el juicio humano. La gravedad sirve para **ordenar** (lo crítico primero), **alertar** (rojo en el feedback) y **reportar** ("cero errores críticos este mes").
- Regla de coherencia opcional: una reseña con una etiqueta crítica no puede tener nota mayor que 2.
- Pregunta para V2: **¿la gravedad depende de la marca?** Por ejemplo, "lenta" podría ser `major` en Boxwell. Se resolvería con `brand_issue_overrides(brand_id, issue_code, severity)` sin tocar lo existente.

### Dónde encajaría un modelo (solo para DECISIONS.md; no se construye)
En el **triage**: decidir cuáles 5 respuestas leer. El modelo marcaría las de riesgo, por ejemplo una devolución ofrecida en Voltra sin pasos de diagnóstico, o una respuesta que no menciona el número de pedido. Antes de confiar en él harían falta cientos de reseñas humanas para medir si coincide con lo que Marta habría elegido. **Nunca pone notas.**

### Preguntas para una V2 (para DECISIONS.md)
- ¿La nota o la rúbrica deberían ser distintas por marca?
- ¿Quién mantiene las reglas de cada marca?
- ¿La marca vería esto directamente o siempre a través del lead?
- ¿Dos leads deberían calificar la misma respuesta para calibrarse?

---

## 3. Roles y visibilidad

La **marca es el tenant**. El rol **no es global**: es **por marca** (`brand_memberships.role` = `lead` | `specialist`). Esta matriz se aplica **en el servidor**.

| Acción | Marta (lead Voltra + Boxwell) | Nuria (lead Hebra) | Dani (esp. Voltra + Boxwell) | Leo (esp. Voltra + Hebra) |
|---|---|---|---|---|
| Ver respuestas de Voltra | todas | no | solo las suyas | solo las suyas |
| Calificar una respuesta de Voltra | sí | no | no | no |
| Ver notas de otro especialista | en sus marcas | en Hebra | no | no |
| Ver la tendencia de la marca | Voltra y Boxwell | Hebra | solo la propia | solo la propia |
| Leer el comentario sobre su respuesta | — | — | sí | sí |
| `GET /api/brands/hebra/replies` | 403 | 200 | 403 | 200, solo las suyas |

**Trampa de los agregados:** mostrarle al especialista una "media del equipo" filtra datos de otros especialistas, aunque no aparezcan nombres. En V1 no se muestra.

---

## 4. Pantallas

Cuatro pantallas y el selector de usuario. La app está en **inglés**.

1. **Cola de revisión** (lead) `/review`: pantalla principal. Respuestas de ayer de sus marcas, con filtro por marca y por "sin reseñar".
   - **Izquierda:** lista con marca, número de ticket, especialista, asunto y la nota si ya tiene.
   - **Derecha:**
     - una franja con la **marca y su regla principal** (p. ej. "Diagnosticar antes de ofrecer devolución") y el tiempo de respuesta calculado;
     - el **mensaje del cliente** y la **respuesta enviada**, visualmente distintos;
     - la **nota 1–5** con botones grandes, las **etiquetas** agrupadas por gravedad, el **comentario** y el botón **"Save and next"**.
   - Atajos de teclado: `1`–`5` ponen la nota, `J`/`K` pasan a la siguiente o a la anterior. Es recortable si falta tiempo.
   - Arriba: "Yesterday · 31 replies · 4 reviewed".
2. **Marca** (lead) `/brands/[slug]`:
   - tendencia semanal de la nota,
   - problemas más frecuentes ordenados por gravedad,
   - tabla por especialista (media, cantidad de reseñas, críticos),
   - últimas reseñas.
3. **Mi feedback** (especialista) `/me`: sus respuestas reseñadas, con nota, etiquetas y comentario, las críticas resaltadas en rojo, y su media y tendencia por marca ("Your trend in Voltra").
4. **Detalle de respuesta** `/replies/[id]`: mensaje del cliente, respuesta enviada, las reglas de la marca (`brands.guidelines`) y la reseña. Lo ven el lead de la marca y el autor de la respuesta.

**Selector de usuario:** en la cabecera, en el hueco `#user-switcher-slot` de `ui/app-shell.tsx`. Muestra el nombre y el rol actuales y permite cambiar a cualquier persona del seed.

Todas las pantallas tienen **estados vacío, de carga y de error diseñados**, usando `ui/empty-state.tsx`, `loading.tsx`, `error.tsx` y `not-found.tsx`.

---

## 5. Arquitectura (decidida)

**Una sola app Next.js que habla directo con Supabase. Sin backend aparte.** La separación de responsabilidades la dan las capas dentro de la app, no servicios separados.

```
sellervate-exercise/
├─ apps/
│  └─ web/                 # Next.js 16 App Router + TS + Tailwind v4
│     ├─ app/              # rutas: review/, brands/[slug]/, me/, replies/[id]/, api/…
│     ├─ features/         # por dominio: review/, feedback/, brand-overview/
│     │   └─ review/{components/, actions.ts, schema.ts}
│     ├─ server/           # todo con import 'server-only'
│     │   ├─ auth/session.ts        # getCurrentUser(), requireLeadOf(), requireMember()
│     │   ├─ data/{replies,reviews,trends}.ts   # consultas tipadas
│     │   └─ supabase/server.ts     # cliente por request con el JWT del usuario
│     └─ ui/               # componentes de presentación compartidos
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/          # una migración por PR que cambia el esquema
│  └─ seed.sql
├─ docs/                   # PLAN.md, DECISIONS.md, TIMELOG.md
└─ ai-logs/                # transcripts de sesiones
```

`apps/` deja lugar para un futuro `apps/ingest` (el importador del helpdesk), que reutilizaría el esquema y los tipos (entonces aparecería `packages/db`).

### Reglas de las capas
- **Lecturas:** en Server Components, llamando a `server/data`. **El navegador nunca habla con Supabase.**
- **Escrituras:** con server actions, siempre en este orden: `getCurrentUser()` → `zod.parse` → cargar la fila objetivo (RLS) → `requireLeadOf(brandId)` → escribir → `revalidatePath`.
- **`brandId` se deriva de la fila en la base de datos, nunca del body.**
- **Un único route handler JSON** (`/api/brands/[slug]/replies`) para cumplir "si pedimos a la API otra marca, dice que no". Devuelve **403**.
- **`service_role` solo en el seed.** La app usa siempre el JWT del usuario, así que RLS aplica siempre.
- Las páginas con datos por usuario son dinámicas. **Nada de caché compartida** (`unstable_cache` o `"use cache"`) sin el usuario en la clave.
- Tipos generados con `supabase gen types`: la base de datos es la fuente de verdad.
- Los agregados (tendencia, problemas frecuentes) son **vistas SQL con `security_invoker = on`**, para que respeten RLS.

Ejemplo de referencia de una server action:
```ts
// apps/web/features/review/actions.ts
'use server'
export async function saveReview(input: unknown) {
  const user = await getCurrentUser();                  // 401 si no hay sesión
  const data = reviewSchema.parse(input);               // zod: score 1–5, issues[], comment
  const reply = await getReplyForReview(data.replyId);  // RLS: null si no la puede ver
  if (!reply) throw new NotFoundError();
  await requireLeadOf(user, reply.brandId);             // 403 explícito
  await insertReview({ ...data, brandId: reply.brandId, reviewerId: user.id });
  revalidatePath('/review');
}
```

### Alternativas descartadas (para DECISIONS.md)
| Alternativa | Por qué no ahora |
|---|---|
| Backend aparte (NestJS / Express) | Duplica la autorización, suma un servicio al README y cuesta ~1 h. Supabase + RLS ya es la capa de datos segura. Tendrá sentido cuando llegue el importador. |
| tRPC / React Query | Server actions y Server Components cubren lectura y escritura sin estado en el cliente. Menos código para revisar. |
| Turborepo + `packages/*` | Hay un solo consumidor. El workspace de pnpm alcanza. |
| Solo chequeos en Next (sin RLS) | Un olvido en una consulta es una fuga. Con RLS, el olvido devuelve vacío en lugar de datos ajenos. |
| Solo RLS (sin chequeo en Next) | Devuelve una lista vacía en lugar de "no", y la UI no distingue "sin datos" de "sin permiso". |

### Qué se rompe primero al crecer (para DECISIONS.md)
- Tendencias calculadas en vivo sobre miles de reseñas → vista materializada o un rollup semanal.
- Una nota 1–5 única no captura criterios por marca → rúbrica versionada por marca (`rubric_version`).
- Dos leads calificando lo mismo → hace falta calibración.
- El login simulado → hay que reemplazar el selector por un login real (las políticas no cambian).

---

## 6. Autorización (decidida): defensa en profundidad

1. **Postgres RLS**: la garantía final.
2. **Chequeo explícito en el servidor** (`server/auth`), para que la API responda **403** y no una lista vacía.

### Login simulado: usuarios de seed reales en Supabase Auth
- El seed crea las personas en `auth.users` con contraseñas conocidas, y `profiles.id = auth.users.id`.
- El selector de usuario hace el login **en el servidor** (`signInWithPassword`) y `@supabase/ssr` guarda la sesión en cookies httpOnly.
- RLS usa `auth.uid()` de verdad.
- **Auth real después** = reemplazar el selector por un formulario de login, magic link o SSO. **Las políticas no cambian.**
- Plan B si esto se traba: firmar el JWT en el servidor con el secreto del proyecto. Es más frágil, porque depende de la clave JWT legacy y las versiones nuevas de Supabase usan claves asimétricas.

```
Navegador ──"ser Dani"──▶ Next (server) ──signInWithPassword──▶ Supabase Auth
          ◀── cookie de sesión httpOnly ──┘
Navegador ──GET /api/brands/hebra/replies──▶ Next: requireMember(user,"hebra") → 403
Navegador ──/brands/voltra──▶ Next ──select con el JWT de Dani──▶ Postgres RLS → solo las respuestas de Dani
```

### Políticas de referencia
```sql
-- Helper: centraliza la regla y evita recursión de RLS
create function public.is_lead_of(b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.brand_memberships m
                 where m.user_id = auth.uid() and m.brand_id = b and m.role = 'lead');
$$;

alter table public.replies enable row level security;
create policy replies_read on public.replies for select to authenticated
  using (specialist_id = auth.uid() or public.is_lead_of(brand_id));

alter table public.reviews enable row level security;
create policy reviews_read on public.reviews for select to authenticated
  using (public.is_lead_of(brand_id)
         or exists (select 1 from public.replies r
                    where r.id = reply_id and r.specialist_id = auth.uid()));
create policy reviews_write on public.reviews for insert to authenticated
  with check (reviewer_id = auth.uid() and public.is_lead_of(brand_id));
```

El README tiene que incluir un `curl` con la cookie de Dani contra una marca ajena y el 403 esperado, para que el evaluador lo compruebe en 10 segundos.

---

## 7. Modelo de datos (decidido)

```
profiles           (id PK = auth.users.id, full_name)
brands             (id PK, slug UNIQUE, name, guidelines text)
brand_memberships  (user_id FK, brand_id FK, role 'lead'|'specialist', PK(user_id, brand_id))
replies            (id PK, brand_id FK, specialist_id FK, source, external_id,
                    subject, customer_message, reply_body, received_at, sent_at,
                    UNIQUE(source, external_id), UNIQUE(id, brand_id))
reviews            (id PK, reply_id, brand_id, reviewer_id FK, score smallint 1–5,
                    comment, is_exemplar bool, created_at,
                    FK (reply_id, brand_id) → replies(id, brand_id),
                    UNIQUE(reply_id, reviewer_id))
issue_types        (code PK, label, severity 'minor'|'major'|'critical', active bool)
review_issues      (review_id FK, issue_code FK, PK(review_id, issue_code))
brand_events       (id, brand_id, happened_on date, note, created_by)   -- opcional
```

Decisiones que defienden el modelo:
- **Rol por marca** (`brand_memberships`), no `profiles.role`: un lead de 4 marcas no ve las otras 2.
- **`unique(source, external_id)`**: la futura importación del helpdesk hace upsert sin duplicar. `source` = `'seed' | 'zendesk' | 'gorgias' | …`.
- **`brand_id` desnormalizado en `reviews`**, con FK compuesta `(reply_id, brand_id) → replies(id, brand_id)`: RLS sin joins, y la base de datos impide que la reseña mienta sobre su marca.
- **`issue_types` como tabla, no como enum de Postgres**: agregar una categoría es un `INSERT` y no una migración. Se desactiva con `active = false` en lugar de borrar, para no romper el historial.
- **La gravedad vive en el tipo de problema**, no en la reseña.
- `severity` y `role` pueden ser `text` + `check`, que es más fácil de migrar que un enum.
- Índices: `replies(brand_id, sent_at)`, `replies(specialist_id)`, `reviews(reply_id)`, `reviews(brand_id)`, `brand_memberships(brand_id)`.
- El seed va en `supabase/seed.sql`, **nunca** dentro de las migraciones.

---

## 8. El gráfico de tendencia

Flujo: `reviews + replies` → vista SQL (media por semana) → Server Component que la lee → componente que la dibuja.

```sql
create view public.brand_weekly_scores
with (security_invoker = on) as        -- respeta RLS: cada usuario agrega solo lo que puede ver
select
  rp.brand_id,
  date_trunc('week', rp.sent_at)::date as week,
  round(avg(rv.score), 2)              as avg_score,
  count(*)                             as reviews,
  count(*) filter (where exists (
    select 1 from public.review_issues ri
    join public.issue_types it on it.code = ri.issue_code
    where ri.review_id = rv.id and it.severity = 'critical'
  ))                                   as critical_count
from public.reviews rv
join public.replies rp on rp.id = rv.reply_id
group by rp.brand_id, date_trunc('week', rp.sent_at);
```

Decisiones (mencionarlas en DECISIONS.md):
- **Fecha = `replies.sent_at`** (cuándo se hizo el trabajo), **no** `reviews.created_at` (cuándo se evaluó). Si no, el gráfico mide cuándo revisa Marta.
- **`security_invoker = on`**: sin eso, la vista se ejecuta con los permisos de su creador y se saltea RLS. Es justo la fuga de agregados que buscan en las reviews.
- **Tamaño de muestra**: la vista devuelve `reviews` (la n). El gráfico la muestra y atenúa los puntos con n < 3.
- **Semanas sin reseñas = hueco, no cero** (`fillMissingWeeks`).
- **Eje Y fijo en 1–5**, para que una subida de 3,9 a 4,1 no parezca enorme.
- Tooltip: "4.1 · 12 reviews · 0 critical".
- **Librería: Recharts** (componente cliente que recibe los datos serializados desde el Server Component), porque en 6 h ahorra tiempo. Se estiliza con los tokens del diseño.
- **"Qué cambiamos":** `brand_events` se dibuja como `<ReferenceLine>` vertical con su nota. Es lo primero que se recorta si falta tiempo.
- **Por rol, sin código extra:** la misma vista le da a Marta la media de toda la marca y a Dani solo la de sus respuestas. Solo cambia el título.

```ts
// server/data/trends.ts
export async function getBrandTrend(brandId: string, weeks = 8) {
  const supabase = await createServerClient();   // JWT del usuario → RLS aplica
  const { data, error } = await supabase
    .from('brand_weekly_scores')
    .select('week, avg_score, reviews, critical_count')
    .eq('brand_id', brandId)
    .gte('week', weeksAgo(weeks))
    .order('week');
  if (error) throw error;
  return fillMissingWeeks(data, weeks);
}
```

---

## 9. Diseño

- Tokens en `apps/web/app/globals.css` (Tailwind v4, `@theme inline`), con modo claro y oscuro por `prefers-color-scheme`.
- **Color:**
  - neutros verde salvia (`ground`, `surface`, `sunken`, `ink`, `ink-muted`, `line`, `line-strong`), calmos para leer mucho texto;
  - **un solo acento azul tinta** (`accent`, "la lapicera del revisor"), reservado para acciones y selección;
  - **semánticos** `good`, `warn` y `bad` (con sus variantes `-soft`), **solo** para resultados de reseñas y gravedad. Nunca decorativos. Convención: `critical` → `bad`, `major` → `warn`, `minor` → neutro.
- **Tipografía:** Instrument Sans (UI y texto de las respuestas), Bricolage Grotesque (títulos, con moderación), JetBrains Mono (notas, fechas, números de ticket, `tabular-nums`).
- **Escala** (rem): 0.75 / 0.8125 / 0.875 / 1 / 1.25 / 1.5 / 2 (`text-2xs` … `text-2xl`).
- Se usan siempre las clases de token (`bg-surface`, `text-ink-muted`, `border-line`, `text-bad`…), **nunca hex sueltos**.
- Estados vacío, de carga y de error **diseñados**: el vacío dice qué falta y qué hacer; el error explica qué pasó y cómo seguir.

---

## 10. Seed

**Marcas** (nombres inventados):

| Marca | Rubro | Regla | Tono |
|---|---|---|---|
| **Voltra** | patinetes eléctricos | diagnosticar primero (bloqueo de batería, firmware, presión de ruedas) y después ofrecer devolución | cercano |
| **Boxwell** | cajas y packaging B2B | 3 líneas, número de pedido, fecha exacta | seco y profesional |
| **Hebra** | tienda de lanas | pocas filas; existe para demostrar el aislamiento entre leads | cálido |

**Personas:**

| Persona | Rol | Marcas | Papel en la demo |
|---|---|---|---|
| Marta | lead | Voltra, Boxwell | ve la cola y la tendencia de dos marcas |
| Nuria | lead | Hebra | demuestra el aislamiento entre leads |
| Dani | especialista | Voltra, Boxwell | tiene la respuesta claramente mala (devolución sin diagnóstico) |
| Leo | especialista | Voltra, Hebra | buen diagnóstico: el ejemplo positivo |
| Sara | especialista | Boxwell, Hebra | cerró tickets sin revisar el historial del pedido (la anécdota de las notas) |

- Unas **45 respuestas en 6 semanas**, **~30 reseñadas**, para que las medias tengan sentido. **Voltra mejora visiblemente** después de un cambio ("checklist de diagnóstico obligatorio", como `brand_events`).
- Unas 8 respuestas escritas con cuidado; el resto son variaciones revisadas.
- Fechas **relativas a `now()`**, para que "ayer" siempre tenga datos.
- Hay respuestas de ayer **sin reseñar**, para que la cola tenga trabajo.
- Contraseña conocida para todos los usuarios del seed (p. ej. `password123`), documentada en el README.

---

## 11. Plan de PRs

| # | Rama | Alcance | Presupuesto | Revisar con lupa |
|---|---|---|---|---|
| 1 | `chore/scaffold` | workspace, app Next, config de Supabase, tokens, shell, README | 30 min | que no haya claves; `.env.example` completo |
| 2 | `feat/schema-seed` | migraciones (tablas, FKs, índices, checks) + `seed.sql` + `pnpm bootstrap` | 60 min | FK compuesta, `unique(source, external_id)`, sin enums, seed fuera de migraciones; que `bootstrap` no escriba la clave `service_role` en `.env.local` |
| 3 | `feat/authz` | usuarios de seed en Auth, selector, RLS, `requireMember`/`requireLeadOf`, cliente por request, API con 403 | 50 min | **`service_role`**, tablas sin RLS, `using (true)`, `brand_id` desde el body |
| 4 | `feat/review-queue` | cola del lead, detalle con reglas de la marca, formulario de reseña (server action + zod), atajos | 60 min | que la acción revalide la membresía; validación de la nota |
| 5 | `feat/my-feedback` | vista del especialista | 30 min | agregados con datos de otros |
| 6 | `feat/brand-overview` | tendencia semanal, problemas frecuentes, tabla por especialista | 45 min | SQL de agregación, semanas vacías, caché por usuario |
| 7 | `feat/states-polish` | `loading`, `error`, `not-found` y vacíos diseñados | 25 min | probablemente "fine, merging" |
| — | `docs/decisions` | DECISIONS.md, README final, TIMELOG | 45 min | ≤ 2 páginas |

Total: ~5 h 45 min + 15 min de colchón.

**Levantar todo con un comando (`pnpm bootstrap`)** — decidido (no `pnpm setup`: es un comando propio de pnpm y le gana al script): no hay `docker-compose` propio. El CLI de Supabase ya levanta el stack con Docker y aplica migraciones y seed; copiar el stack self-hosted costaría 1–2 h y arriesgaría Auth, del que depende la autorización. `scripts/bootstrap.mjs` (Node, para que funcione igual en Windows) hace: `supabase start` → `supabase db reset` → lee `supabase status -o json` → crea `apps/web/.env.local` con la URL y la clave anon/publishable **solo si no existe**, y **nunca** escribe `service_role`. Va a Architecture en DECISIONS.md.

**Orden de recorte si falta tiempo:** `brand_events` → atajos de teclado → tabla por especialista en la página de marca.

---

## 12. Checklist de review (para cada PR)

**Fuga entre tenants**
- `SUPABASE_SERVICE_ROLE_KEY` usada en rutas de usuario
- tabla nueva sin `enable row level security`
- política con `using (true)`
- `brand_id` o `user_id` tomados del cliente
- filtrado en el componente en lugar de en la consulta
- agregados que incluyen a otros especialistas
- página cacheada y compartida entre usuarios
- vista sin `security_invoker = on`

**La migración que en 3 meses no se va a poder correr**
- enum de Postgres para categorías
- rol global en `profiles`
- falta `external_id` o no es `unique`
- borrado duro de filas referenciadas
- datos de seed dentro de migraciones
- FKs sin índice

**No vale la pena discutir**
- nombres de variables o clases
- duplicación menor de Tailwind
- falta de tests (una línea en DECISIONS.md: se testearían primero las políticas RLS con pgTAP / `supabase test db`, porque ahí un error cuesta una cuenta)
- casos borde de fechas fuera del seed

En cada review, dejar al menos un **"lo dejo pasar porque…"**: muestra criterio, no solo detección.
