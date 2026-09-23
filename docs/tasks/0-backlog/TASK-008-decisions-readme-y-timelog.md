---
id: TASK-008
titulo: DECISIONS.md, README final y TIMELOG
estado: backlog
prioridad: alta
estimacion: 45
creada: 2026-09-23
actualizada: 2026-09-23
rama:
pr:
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

- [ ] DECISIONS.md ≤ 2 páginas, con las cuatro secciones completas
- [ ] Product: el problema, qué primero, qué fuera, dónde encaja un modelo (triage, sin notas), preguntas de V2
- [ ] Architecture: forma, modelo de datos, dónde se autoriza, qué hace falta para auth real, qué se rompe primero
- [ ] AI: cómo se trabajó, dónde acertó y dónde se corrigió al agente, un prompt tal cual
- [ ] Status: hecho / a medias / sin tocar por prioridad, y lo que más criticaríamos si fuera de otro
- [ ] Una línea sobre tests: qué primero (RLS con pgTAP) y por qué no
- [ ] README: clone → app en < 10 min, seed, cómo cambiar de rol, `curl` del 403, horas reales
- [ ] TIMELOG completo y el total en el README

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

(vacío — no empezada)
