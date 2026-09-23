# Transcript de sesión — 01-analisis

Exportado desde Claude Code. Mensajes del usuario y del asistente completos; las llamadas a herramientas aparecen resumidas en una línea y sus resultados se omiten. El log crudo está en el `.jsonl` de al lado.


---

## 🧑 Usuario

@"C:\Users\ASUS\Downloads\Sellervate-Technical-Exercise.pdf"
Podes leer este pdf he indicarme las reglas del proyecto, de que trata, el problema a resolver, lo que deberia tener en cuenta,etc


> 🔧 `Read` — C:\Users\ASUS\Downloads\Sellervate-Technical-Exercise.pdf


> 🔧 `Bash` — Extract text from the PDF with Python


### 🤖 Asistente

Leí el PDF completo (7 páginas). Te dejo el resumen organizado.

## De qué trata

**Sellervate** gestiona la atención al cliente de marcas de ecommerce: responden el soporte **haciéndose pasar por la marca**, así que el cliente final nunca sabe que existen. Cada especialista cubre varias marcas al día y cada marca quiere algo distinto:
- **Marca técnica** (patinetes): primero se diagnostica el problema y después se ofrece la devolución.
- **Marca commodity** (packaging): respuestas rápidas, exactas, de unas 3 líneas.

**El problema:** hoy la calidad la revisa un team lead abriendo el inbox, leyendo por encima lo del día anterior y avisando por Slack. No escala (se rompe a partir de la cuarta marca), no queda registro, no sirve para dar coaching y no pueden demostrarle al cliente que están mejorando.

**Lo que piden:** una **herramienta interna** en la que un team lead evalúa respuestas que ya se enviaron y el especialista lee esa evaluación. No hay especificación, ni lista de pantallas, ni casos de uso. Interpretarlo es parte de la prueba.

## Qué NO es
- No es un helpdesk, ni un inbox, ni un sistema de tickets. Dentro de la herramienta nadie habla con clientes.
- **No es un producto de IA.** No hagas scoring automático: lo dicen explícitamente ("habrás construido bien lo equivocado"). Si crees que un modelo encaja en algún sitio, lo explicas en un párrafo en DECISIONS.md, no lo implementas.

## Escenario de referencia
- **Marta** (team lead, 3 marcas) ve las ~30 respuestas de ayer, evalúa 5 y deja nota y comentario (lenta, tono equivocado, respondió otra pregunta, correcta pero no evita que el cliente vuelva a escribir…).
- Dos semanas después la marca pregunta cómo va la cosa, y ella puede enseñar la **tendencia**, **lo que se repite mal** y **lo que se cambió**.
- **Dani** (especialista) ve **solo sus propios scores** y los comentarios que le dejaron.

## Las notas de la reunión (el único brief)
Puntos clave:
- "En tres respuestas sé si alguien leyó los procedimientos de la marca", pero ella revisa unas 5 al día de cientos.
- Equivocarse de tono molesta; **dar información incorrecta sobre el producto hace perder la cuenta**.
- Un especialista estuvo un mes cerrando tickets sin mirar el historial de pedidos, y se enteraron porque lo descubrió la marca.
- Hay 6 marcas: Marta cubre 4 y Nuria las otras 2, así que ninguna de las dos ve el panorama completo.
- El especialista ve sus scores, no los de los demás.
- Para el onboarding quieren ejemplos buenos y malos con la explicación.
- Cada trimestre quieren **enseñar el número** en lugar de decir "estamos mejorando".
- **Más adelante se importará del helpdesk automáticamente. Ahora no, pero no lo hagas imposible.** Esto afecta al modelo de datos.

**Tienes que elegir una lectura** y construirla bien, explicando por qué:
1. **Revisión:** el bucle de calificar rápido y de forma consistente.
2. **Prueba:** tendencias y evidencia para enseñar al cliente.
3. **Coaching:** una biblioteca de ejemplos buenos y malos con su razonamiento.

(Hay otras lecturas válidas; estas son ejemplos del tamaño de decisión que esperan.)

## Reglas duras
| Regla | Detalle |
|---|---|
| **Tiempo** | **Máximo 6 horas**, reales y anotadas en el README. Puedes repartirlas en **1 semana**. Pasarte cuenta en contra. |
| **Stack** | Monorepo público en GitHub, **Next.js App Router + TypeScript**, **Supabase (Postgres)** (local o free tier; no se puede cambiar), **Tailwind** (daisyUI opcional). |
| **Auth** | **Se puede simular** (un selector de usuario en una esquina está bien). |
| **Autorización** | **NO se puede simular.** Se aplica en el servidor. Si cambian a especialista y piden por API datos de otra marca, tiene que devolver un rechazo. Ocultar un botón no cuenta. |
| **Seed data** | Inventada por ti: mínimo **2 marcas, 3 especialistas, 2 team leads**, suficientes scores para que un promedio tenga sentido. Respuestas **realistas** (nada de lorem ipsum), con marcas que suenen claramente distintas y alguna claramente mala. |
| **Flujo Git** | Una rama por pieza de trabajo → el agente escribe el código y abre el PR → **tú lo revisas por escrito en el PR** → commits de corrección en la misma rama → merge. **Sin squash, sin rebase, sin un PR gigante al final.** 4 o 5 PRs reales es suficiente. |
| **Diseño** | Les importa mucho. Referencia: sellervate.com (sin copiarla). Escala tipográfica elegida, sistema de color que puedas explicar, y estados vacío, de carga y de error diseñados. |
| **README** | Del clone a la app corriendo en menos de 10 minutos, seed, cómo cambiar de rol y horas reales. Si usaste un starter, nómbralo. |
| **Tests** | No son obligatorios. Pon una línea sobre qué testearías primero y por qué no lo hiciste. |

## Entregables
1. **Repo público** con ramas y PRs intactos. Si usas logs de sesión o archivos de prompts, commitéalos.
2. **README.md**
3. **DECISIONS.md** (2 páginas como máximo), con estas secciones:
   - **Producto:** el problema real, qué construiste primero, qué dejaste fuera, dónde encajaría un modelo y qué preguntarías para una V2.
   - **Arquitectura:** por qué esa forma, el modelo de datos, dónde se aplica la autorización, qué haría falta para auth real y qué se rompe primero al crecer.
   - **IA:** cómo trabajaste, dónde acertó el agente, dónde lo corregiste y un prompt del que estés orgulloso.
   - **Estado:** qué está terminado, qué a medias y qué sin tocar, en orden de prioridad. Además, **la cosa de tu repo que más criticarías si fuera el PR de otro**, y por qué la dejaste.
4. El link del repo y las horas reales, **en el texto de la propuesta de Upwork**. Sin eso, no la leen.

## Cómo puntúan
| Dimensión | Peso |
|---|---|
| **Cómo trabajaste (PRs y reviews)** | **24** |
| Interpretación y priorización | 18 |
| Arquitectura y código | 13 |
| Modelo de datos | 12 |
| Seguridad y aislamiento por tenant | 10 |
| UI y calidad visual | 10 |
| DECISIONS.md | 8 |
| Terreno cubierto | 5 |

**El 42% es proceso e interpretación, no código.** Lo que más pesa es que se vea que lees de verdad lo que te entrega el agente.

## Lo que yo tendría en cuenta
1. **Las reviews de los PRs son lo más importante.** Buscan específicamente que detectes:
   - **fugas de datos entre tenants** (marcas o especialistas),
   - **migraciones que en 3 meses no se podrán correr**,
   - lo que no vale la pena discutir.

   Escribe reviews honestas y concretas. Si algo está bien, basta con "LGTM, merging".
2. **Autorización con RLS de Supabase y además un chequeo en la capa de server (server actions / route handlers).** Así tienes defensa en profundidad y puedes explicar el porqué. Como la auth es simulada, necesitas que el "usuario actual" llegue al servidor (una cookie, por ejemplo) y que la base de datos o el servidor lo validen. Nunca filtres solo en el cliente.
3. **Modelo de datos pensado para crecer.** Algo como `brands`, `users` + `brand_memberships` (rol por marca), `replies` con `external_id` / `source` (para la futura importación del helpdesk), `reviews` y `review_tags` o categorías de error. Evita meter enums rígidos que luego duela migrar.
4. **Elige una lectura y di que la elegiste.** Por ejemplo, "revisión + la vista del especialista", con la tendencia por marca como algo mínimo. Recortar con criterio puntúa más que abarcar.
5. **Seed de calidad:** pocas respuestas pero muy creíbles, con dos marcas claramente distintas (patinetes vs. packaging) y una respuesta evidentemente mala.
6. **Cuidar el diseño:** tipografía, paleta y los estados vacío, carga y error.
7. **Controla el reloj:** unas 4h30 de build y unos 45 min para DECISIONS.md. Ve anotando tiempos desde el principio.

¿Quieres que armemos el plan: lectura del problema, modelo de datos, estrategia de autorización y el desglose en PRs?


---

## 🧑 Usuario

si hazlo, ademas agrega graficos del problema y lo que sea necesario para que sea fácil de entender


> 🔧 `Artifact` — quickstart


> 🔧 `Write` — C:\Users\ASUS\AppData\Local\Temp\claude\D--Work-Freelance-sellervate-project\a37dd267-dd8d-4806-9806-bd8c13321575\scratchpad\sellervate-plan.html


> 🔧 `Artifact` — Plan del ejercicio técnico de Sellervate: problema, alcance, modelo de datos, autorización, PRs y seed, con diagramas.


### 🤖 Asistente

Te armé el plan como una página con diagramas: https://claude.ai/artifact/MaM9ZxqagyxY4abkmQYKNu (es privada, solo la ves tú). No la revisé en el navegador antes de publicarla; si algún diagrama se ve roto, dime cuál y lo arreglo.

**Qué incluye:**
- **El problema** en un diagrama de flujo, desde el cliente hasta el Slack que no deja registro, y los tres puntos que duelen.
- **Qué construir.** La recomendación es la lectura de revisión como núcleo. La tendencia por marca va en versión mínima y la biblioteca de coaching queda para después, con un campo ya previsto en la base de datos. Incluye la lista de lo que queda fuera y los supuestos que hay que dejar escritos.
- **Quién ve qué:** una tabla de permisos por persona y por marca, incluida la respuesta esperada de la API (403 o 200).
- **Pantallas:** son 4, con un boceto de la cola de revisión y un gráfico de tendencia con datos inventados de ejemplo.
- **Modelo de datos:** un diagrama de tablas con las decisiones clave. El rol se guarda por marca, cada respuesta lleva `source` + `external_id` para la futura importación del helpdesk, y los tipos de problema van en una tabla con gravedad en lugar de un enum.
- **Autorización:** un diagrama del flujo de una petición y el SQL de las políticas RLS. Propongo usar usuarios de seed reales en Supabase Auth con un selector de usuario, más un chequeo en el servidor para devolver 403.
- **Plan de 7 PRs** con presupuesto de tiempo (5 h 35 min más 25 min de colchón), cómo se ve el historial de Git y detalles prácticos. Por ejemplo, GitHub no deja aprobar tu propio PR, así que la revisión se hace con "Comment".
- **Qué revisar en cada PR:** fugas de datos entre marcas, migraciones que en 3 meses no se podrán correr y cosas que no vale la pena discutir.
- **Seed:** 3 marcas inventadas (Voltra patinetes, Boxwell packaging, Hebra lana) y 5 personas, cada una con un papel en la demo.
- **Esqueleto de DECISIONS.md**, incluido dónde encajaría un modelo de IA: ayudar a elegir cuáles 5 respuestas leer, nunca poner notas.

Si quieres, empezamos con el PR1: crear el proyecto con Next.js, Tailwind y Supabase local, e iniciar el repo con git.


---

## 🧑 Usuario

no se estan viendo los graficos cuando descargo el html, ademas que arquitectura recomiendas?


### 🤖 Asistente

Los diagramas no salen en el HTML descargado porque el visor de artifacts dibuja los Mermaid por su cuenta y el archivo suelto no trae esa librería. Voy a añadirle un cargador de Mermaid y una sección de arquitectura.


> 🔧 `Edit` — C:\Users\ASUS\AppData\Local\Temp\claude\D--Work-Freelance-sellervate-project\a37dd267-dd8d-4806-9806-bd8c13321575\scratchpad\sellervate-plan.html


> 🔧 `Edit` — C:\Users\ASUS\AppData\Local\Temp\claude\D--Work-Freelance-sellervate-project\a37dd267-dd8d-4806-9806-bd8c13321575\scratchpad\sellervate-plan.html


> 🔧 `Edit` — C:\Users\ASUS\AppData\Local\Temp\claude\D--Work-Freelance-sellervate-project\a37dd267-dd8d-4806-9806-bd8c13321575\scratchpad\sellervate-plan.html


> 🔧 `mcp__Claude_Browser__preview_start` — file:///C:/Users/ASUS/AppData/Local/Temp/claude/D--Work-Freelance-sellervate-project/a37dd267-dd8d-4806-9806-bd8c13321575/scratchpad/sellervate-plan.html


> 🔧 `mcp__Claude_Browser__javascript_tool` — javascript_exec


> 🔧 `Bash` — Serve the plan HTML locally for a check


### 🤖 Asistente

Estoy comprobando en el navegador que los diagramas se dibujan fuera del visor de artifacts.


> 🔧 `mcp__Claude_Browser__browser_batch`


### 🤖 Asistente

All 6 render. Publishing the update and stopping the server.


> 🔧 `Artifact` — C:\Users\ASUS\AppData\Local\Temp\claude\D--Work-Freelance-sellervate-project\a37dd267-dd8d-4806-9806-bd8c13321575\scratchpad\sellervate-plan.html


> 🔧 `Bash` — Stop the local preview server


> 🔧 `PowerShell` — Stop the local preview server


### 🤖 Asistente

Ya actualicé la página, en la misma URL: https://claude.ai/artifact/MaM9ZxqagyxY4abkmQYKNu

**Diagramas en el HTML descargado:** el visor de artifacts dibuja los diagramas por su cuenta, pero un archivo suelto no trae esa librería. Le añadí un script que, si al abrir la página los diagramas siguen como texto, descarga Mermaid y los dibuja. Lo abrí servido en local en el navegador y se dibujan los 6. Para eso necesitas conexión a internet al abrir el archivo.

**La arquitectura que recomiendo** (está en la nueva sección "Arquitectura"):

- **Una sola app Next.js que habla directo con Supabase, sin backend aparte.** El repo lleva `apps/web`, `supabase/`, `docs/` y `ai-logs/`, con un workspace de pnpm. Queda hueco para un futuro `apps/ingest`, el importador del helpdesk que piden no hacer imposible.
- **Capas dentro de la app:**
  1. `app/`: las páginas, que leen datos en el servidor.
  2. `features/`: los componentes y las acciones de guardado de cada funcionalidad.
  3. `server/`: el código que solo corre en el servidor. Tiene la sesión y los permisos (`requireLeadOf`), las consultas tipadas y un cliente de Supabase por petición con el token del usuario.
  4. Postgres, con las políticas RLS como protección final.
- **Reglas que conviene defender en DECISIONS.md:**
  - El `brandId` se saca de la base de datos, nunca del formulario.
  - La clave `service_role` de Supabase solo se usa en el seed.
  - Un único endpoint JSON que devuelve 403, para cumplir que la API "diga que no".
  - Las tendencias van en vistas SQL con `security_invoker`, para que respeten los permisos.
  - Nada de caché compartida entre usuarios.
- **Por qué no un backend aparte con NestJS:** tendrías la autorización repetida en dos sitios, un servicio más que levantar en el README y como una hora que no hay. Tendría sentido más adelante, cuando llegue el importador del helpdesk. La página tiene una tabla con esta y otras alternativas descartadas, y un ejemplo de la acción que guarda una reseña.

¿Arrancamos con el PR1 (crear el proyecto y la estructura del repo)?


---

## 🧑 Usuario

Todavía, necesito entender un poco mas el problema. Entonces El team lead lee 5 comentarios y tiene que puntuarlos  y ver si estuvo bien o no, que falto y recomiendaciones. Eso va a puntuar y los Especialistas van a poder ver sus puntuaciones y asi tener un registro para ver si estan mejorando, haciendo caso a las correciones,etc?


### 🤖 Asistente

Sí, lo entendiste bien. Te afino algunos matices que importan para decidir qué construir.

## Lo que lee el team lead no son "comentarios"

Son **respuestas que el especialista ya envió a clientes**, haciéndose pasar por la marca. Por ejemplo:

> **Cliente (a "Voltra"):** "Mi patinete no enciende, ¿me lo cambian?"
> **Dani respondió:** "Claro, ya generamos la etiqueta de devolución."

Esa respuesta ya salió y no se puede corregir. La herramienta sirve para **evaluarla después** y dejar constancia.

## El ciclo completo

1. **El especialista responde** en el helpdesk de la marca. Eso pasa fuera de tu herramienta.
2. **Al día siguiente, el team lead** abre tu herramienta y ve las respuestas de ayer de sus marcas (unas 30). Lee unas 5 y en cada una registra:
   - **Una nota** ("¿estuvo bien?").
   - **Qué falló**: tono equivocado para esa marca, no diagnosticó, respondió otra pregunta, no revisó el historial del pedido, lenta, correcta pero el cliente va a volver a escribir…
   - **Un comentario o recomendación**: "En Voltra, 'no enciende' suele ser el bloqueo de batería. Antes de ofrecer el cambio, pide que mantenga pulsado 10 s."
3. **El especialista** entra y ve **solo sus propias respuestas evaluadas**, con la nota y lo que escribió el lead. No ve las de sus compañeros.
4. **Con el tiempo** eso se convierte en un **registro**, y ahí está el valor real.

## Quién usa ese registro, y para qué

Es el mismo dato con cuatro usos:

| Quién | Pregunta que responde |
|---|---|
| **Especialista** (Dani) | "¿Estoy mejorando? ¿Qué me corrigen siempre?" |
| **Team lead** (Marta) | "¿Dani dejó de ofrecer devoluciones sin diagnosticar después de que se lo marqué? ¿Quién está cerrando tickets sin mirar el pedido?" |
| **La marca** (cliente de Sellervate) | "¿Están mejorando?" → Marta le enseña la tendencia: "este es el número, esto es lo que fallábamos y esto cambiamos." |
| **Onboarding** | "Estas son respuestas buenas y malas de Voltra, y por qué." |

Lo de "si hacen caso a las correcciones" que mencionas se puede ver de forma concreta: si a Dani le marcaron "no diagnosticó" en la semana 2, ¿vuelve a aparecer esa etiqueta en la semana 4? Esa pregunta **solo se puede responder si "qué falló" se guarda como categorías, no solo como texto libre**. Por eso en el plan propuse etiquetas de problema además del comentario.

## Tres matices que cambian el diseño

1. **"Bien" depende de la marca.** La misma respuesta puede ser un 5 en la marca de packaging (corta y exacta) y un 2 en la de patinetes (no diagnosticó). Al evaluar, el lead tiene que ver **las reglas de esa marca** junto a la respuesta.
2. **No todos los errores pesan igual.** Un tono un poco desviado molesta. Darle al cliente información incorrecta sobre su producto hace perder la cuenta. Por eso las etiquetas llevan gravedad (menor, mayor, crítica).
3. **Es una muestra, no una auditoría completa.** Revisan unas 5 de cientos. La herramienta no pretende revisar todo, sino que lo poco que se revisa **quede guardado y sea consistente**. Si alguna vez hubiera IA, su lugar lógico sería ayudar a elegir *cuáles* 5 leer, nunca poner la nota.

## Qué NO pasa en la herramienta

- Nadie responde a clientes.
- El especialista no contesta ni discute la nota. Eso sería una V2 posible y en V1 lo dejaríamos fuera.
- La IA no califica.

En resumen: **hoy el juicio del team lead se pierde en Slack; tu herramienta lo guarda de forma estructurada** para que sirva al especialista (mejorar), al lead (coaching y detectar patrones) y a la marca (pruebas de mejora).

¿Quieres que siga con otra duda del problema o pasamos a construir?


---

## 🧑 Usuario

Como se define el peso de la etiqueta?


### 🤖 Asistente

No lo define el enunciado, lo defines tú. Es un supuesto que tomas a partir de las notas de la reunión y que tienes que escribir y defender en DECISIONS.md.

## De dónde sale

Las notas dan la escala casi textual:

> "Getting the tone slightly wrong is annoying. Telling a customer the wrong thing about their own product is how we lose the account."

Traducido a una regla: **la gravedad mide el daño a la relación con la marca, no lo mal escrita que esté la respuesta.**

| Gravedad | Criterio | Etiquetas |
|---|---|---|
| **Crítica** | Puede hacer perder la cuenta o dañar al cliente | Información incorrecta sobre el producto o la política · No revisó el historial del pedido · Saltó un procedimiento obligatorio de la marca (p. ej. ofrecer devolución sin diagnosticar en Voltra) |
| **Mayor** | El problema del cliente no se resuelve y vuelve a escribir | Respondió otra pregunta · Correcta pero incompleta (el cliente va a volver) |
| **Menor** | Molesta, pero no rompe nada | Tono equivocado para la marca · Demasiado larga o corta · Lenta |

"No revisó el pedido" es crítica por la anécdota de las notas: un especialista estuvo un mes haciéndolo y **lo descubrió la marca**.

## Dónde vive

Es un atributo del **catálogo de etiquetas**, no algo que el lead elige cada vez:

```sql
issue_types
  code      'wrong_product_info'
  label     'Información incorrecta sobre el producto'
  severity  'critical'   -- minor | major | critical
  active    true
```

En V1 lo cargas en el seed y es global. El lead solo marca la etiqueta y la gravedad viene incluida, así las evaluaciones son consistentes entre leads.

## Para qué se usa (y para qué no)

**No** la uses para calcular la nota. Nada de "5 menos 2 puntos por crítica". Sería puntuación automática, justo lo que el enunciado desaconseja, y además la nota es el juicio del lead. Lo que sí hace:

- **Ordenar y resaltar.** En la página de marca, los problemas críticos salen primero aunque sean menos frecuentes. Una "información incorrecta" pesa más que diez "tono".
- **Alertar.** Si a un especialista le marcan una crítica, se ve de inmediato en rojo en su feedback y en la vista del lead.
- **Responder al cliente.** "En el último mes, cero errores críticos" es exactamente el número que Marta quiere enseñar.

Una regla opcional razonable, que puedes defender: **una respuesta con una etiqueta crítica no puede tener nota mayor que 2.** La nota la sigue poniendo el humano; solo se valida que sea coherente.

## Lo que queda abierto

Esto lo escribes en DECISIONS.md como pregunta para V2:

- **¿La gravedad depende de la marca?** Probablemente sí. "Lenta" es menor en Voltra, pero en Boxwell, donde el valor es ser rápido y exacto, podría ser mayor. El modelo está preparado: sería una tabla `brand_issue_overrides(brand_id, issue_code, severity)` sin tocar nada de lo existente.
- **¿Quién mantiene el catálogo?** En V1, el seed. Más adelante, un lead o admin desde la UI, desactivando etiquetas (`active = false`) en lugar de borrarlas para no romper el historial.

Resumen: **la gravedad la fijas tú en el catálogo según el daño a la cuenta, es global en V1 y sirve para ordenar, alertar y reportar, no para calcular la nota.**


---

## 🧑 Usuario

y como se genera el grafico?


### 🤖 Asistente

El gráfico sale de las reseñas que ya guardas. No hay que calcular nada aparte: es una consulta de agregación más un componente que la dibuja.

## El flujo

```
reviews + replies  →  vista SQL (media por semana)  →  Server Component la lee  →  componente de gráfico la dibuja
```

## 1. La consulta: agrupar por semana

```sql
create view public.brand_weekly_scores
with (security_invoker = on) as        -- respeta RLS: cada usuario solo agrega lo que puede ver
select
  rp.brand_id,
  date_trunc('week', rp.sent_at)::date          as week,
  round(avg(rv.score), 2)                       as avg_score,
  count(*)                                      as reviews,
  count(*) filter (where exists (
    select 1 from review_issues ri
    join issue_types it on it.code = ri.issue_code
    where ri.review_id = rv.id and it.severity = 'critical'
  ))                                            as critical_count
from reviews rv
join replies rp on rp.id = rv.reply_id
group by rp.brand_id, date_trunc('week', rp.sent_at);
```

Hay tres decisiones escondidas aquí que conviene mencionar en DECISIONS.md:

1. **¿Qué fecha se usa?** `replies.sent_at` (cuándo se hizo el trabajo), **no** `reviews.created_at` (cuándo se evaluó). Si Marta evalúa el lunes respuestas de la semana pasada, la nota tiene que caer en la semana pasada. Si no, el gráfico mide cuándo revisa Marta, no cómo trabaja el equipo.
2. **`security_invoker = on`.** Sin eso, la vista se ejecuta con los permisos de su creador y **se salta RLS**: un especialista vería la media de todo el equipo. Es exactamente la fuga de "agregados" que buscan en las reviews de los PRs.
3. **Semanas con pocas reseñas.** Una media de 2 reseñas no significa nada. Por eso la vista devuelve `reviews` (la n), y el gráfico enseña ese número y atenúa los puntos con n < 3.

## 2. Leerla en el servidor

```ts
// server/data/trends.ts
import 'server-only';
export async function getBrandTrend(brandId: string, weeks = 8) {
  const supabase = await createServerClient();      // con el JWT del usuario → RLS aplica
  const { data, error } = await supabase
    .from('brand_weekly_scores')
    .select('week, avg_score, reviews, critical_count')
    .eq('brand_id', brandId)
    .gte('week', weeksAgo(weeks))
    .order('week');
  if (error) throw error;
  return fillMissingWeeks(data, weeks);             // semanas sin datos = hueco, no cero
}
```

```tsx
// app/brands/[slug]/page.tsx  (Server Component)
const brand = await requireBrandAccess(slug);      // 403/404 si no es su marca
const trend = await getBrandTrend(brand.id);
return <TrendChart data={trend} />;
```

Las semanas sin reseñas tienen que ser un **hueco** en la línea, no un 0. Un cero hundiría la media y mentiría.

## 3. Dibujarlo

Dos opciones razonables:

| | Recharts | SVG propio |
|---|---|---|
| Cómo | `'use client'` + `<LineChart>` con los datos serializados | Server Component que calcula las coordenadas y pinta `<polyline>` |
| A favor | Tooltip, ejes y responsive incluidos; el agente lo escribe en minutos | Sin JS en el cliente y control total del diseño |
| En contra | Hay que pelear un poco con los estilos para que siga tus tokens | Tooltip y ejes a mano |

**Recomiendo Recharts** por el tiempo: son 6 horas y el gráfico no es el núcleo. Lo que sí merece cuidado es el diseño: colores de tus tokens, el eje fijo en 1–5 (si no, una subida de 3.9 a 4.1 parece enorme) y un tooltip con "4.1 · 12 reseñas · 0 críticas".

## 4. El extra que responde al brief: "qué cambiamos"

Marta quiere decirle al cliente *"aquí está la tendencia y esto es lo que cambiamos"*. Eso es una marca vertical en el gráfico, como la línea punteada del plan. Cuesta una tabla mínima:

```sql
brand_events (id, brand_id, happened_on date, note text, created_by)
-- "Checklist de diagnóstico obligatorio antes de ofrecer devolución"
```

Y en Recharts es un `<ReferenceLine x={week} label={note} />`. Es barato y convierte el gráfico en la prueba que pide el cliente. Si vas justo de tiempo, es lo primero que recortaría, pero lo dejaría en la lista de pendientes.

## Qué ve cada rol, sin código extra

Gracias a RLS + `security_invoker`, **la misma vista** da resultados distintos según quién consulta:
- **Marta:** la media de todo el equipo en Voltra.
- **Dani:** solo la media de *sus* respuestas en Voltra, que es su propia evolución.

Para Dani solo cambia el título ("Tu evolución en Voltra"); la consulta es la misma.


---

## 🧑 Usuario

bien, ahora busca el transcript de esta sesion y guardalo  en este proeycto, como 01-analisis o algo asi


> 🔧 `Bash` — List session transcripts and project folder


> 🔧 `Bash` — Inspect transcript record structure


> 🔧 `Write` — C:\Users\ASUS\AppData\Local\Temp\claude\D--Work-Freelance-sellervate-project\a37dd267-dd8d-4806-9806-bd8c13321575\scratchpad\export_transcript.py


> 🔧 `Bash` — Copy transcript into project and export readable Markdown
