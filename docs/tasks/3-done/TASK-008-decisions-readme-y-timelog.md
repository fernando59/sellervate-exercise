---
id: TASK-008
titulo: DECISIONS.md, README final y TIMELOG
estado: done
prioridad: alta
estimacion: 45
creada: 2026-09-23
actualizada: 2026-09-25
rama: main (commit directo, pedido del usuario)
pr: (sin PR)
tags: [docs]
depende_de: [TASK-003]
bloqueada_por:
---

# TASK-008 · DECISIONS.md, README final y TIMELOG

## Qué se espera

El evaluador entiende en diez minutos qué se construyó, por qué, qué se dejó fuera y cómo comprobarlo, y levanta la app del clone en menos de diez minutos.

## Contexto

Entregables del enunciado (docs/PLAN.md § 1). DECISIONS.md tiene máximo 2 páginas y cuatro secciones: Product, Architecture, AI, Status. Pesa un 8 %, pero es la base de la entrevista.

## Criterios de aceptación

- [x] DECISIONS.md ≤ 2 páginas, con las cuatro secciones completas
- [x] Product: el problema, qué primero, qué fuera, dónde encaja un modelo (triage, sin notas), preguntas de V2
- [x] Architecture: forma, modelo de datos, dónde se autoriza, qué hace falta para auth real, qué se rompe primero
- [x] AI: cómo se trabajó, dónde acertó y dónde se corrigió al agente, un prompt tal cual
- [x] Status: hecho / a medias / sin tocar por prioridad, y lo que más criticaríamos si fuera de otro
- [x] Una línea sobre tests: qué primero (RLS con pgTAP) y por qué no
- [x] README: clone → app en < 10 min, seed, cómo cambiar de rol, `curl` del 403, horas reales
- [x] TIMELOG completo y el total en el README

## Fuera de alcance

Código de producto.

## Aislamiento entre marcas

(no aplica: documentación)

## Cómo se valida

1. Clonar en una carpeta nueva y seguir solo el README, con cronómetro.
2. Leer DECISIONS.md impreso: ≤ 2 páginas.

## Qué se testearía

(no aplica)

## Verificación

El recorrido del README desde cero y `code-reviewer` sobre los documentos.

## Convenciones

Todo en inglés. Sin inventar: cada afirmación de Status tiene que ser verificable en el repo.

## Skills a usar

(ninguna)

## Documentación a consultar

(ninguna — documentación propia)

## Qué hacer

Completar las secciones marcadas TBD en DECISIONS.md, cerrar el TIMELOG, exportar el último log a `ai-logs/`.

## Qué NO hacer

No pasar de 2 páginas. No prometer lo que está a medias.

## Notas de implementación

### 2026-09-25 · Cierre de la prueba
- A pedido del usuario, se hizo en un commit directo sobre `main`, sin rama ni PR.
- TIMELOG con los bloques reales del timer del usuario: 5:57:55. El tiempo de este cierre de documentación no está en ese total.
- DECISIONS.md: unas 1200 palabras, las cuatro secciones completas. Las correcciones al agente salen de las notas de TASK-003 a TASK-006 y de los logs; el prompt citado es de `ai-logs/06-feat-review-queue.md`.
- TASK-007 y TASK-009 quedan en `0-backlog` y figuran como "Not started" en Status.
- Se exportaron los logs que faltaban (`07-feat-my-feedback`, `08-feat-brand-overview`) con el hook y se verificó que no contienen el email.
- El README se revisó contra el seed (55 respuestas, 46 reseñadas). No se cronometró un clone desde cero.
