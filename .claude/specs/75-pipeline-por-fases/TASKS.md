# Tareas atómicas: pipeline de generación por fases

> Cada tarea = un commit en develop. TDD estricto: test rojo antes de producción.
> Orden: generador → studio-api → frontend puro → runner → UI → gates.

## Generador (libs/generators/fill-flow-slots)

- [ ] TASK-01: Reintento por hueco — test rojo + implementación: al rechazar el gate se
      re-propone una vez con el motivo en el prompt (presupuesto 2 propuestas/hueco).
- [ ] TASK-02: Modo reparación — schema (`repair`, `report`) + selección de candidatos
      (huecos rellenos citados en el report) + re-propuesta con extracto del report +
      restauración del cuerpo anterior si el gate rechaza. Tests de todo ello.

## Studio-api

- [ ] TASK-03: `validate-progress.ts` (catálogo de comprobaciones + eventos) e
      `implicated-slots.ts` (sospechosos por basename en la salida del fallo). Tests.
- [ ] TASK-04: `POST /studio/validate/stream` — controller NDJSON secuencial con
      `insideWorkspace`, killGroup al cerrar, `{type:'done', ok, failedCheck?, suspects?, output}`. Tests.
- [ ] TASK-05: `POST /studio/repair/stream` — report a tmpfile + spawn de
      `fill-flow-slots --repair --report` + traducción con `describeFillLine`. Tests.

## Frontend — lógica pura

- [ ] TASK-06: `generate-phases.ts` — fases `fill`/`validate`/`repair` en `CATALOG`,
      `statusAtStart` con `skipInstall`, `applySkip`, ramas de `runningFraction`. Tests.

## Frontend — runner

- [ ] TASK-07: `generate-runner.ts` — encadenar el relleno tras `done ok` (extraer la lógica
      del botón a método común; skip si no hay huecos). Tests.
- [ ] TASK-08: `generate-runner.ts` — fase validate: stream, estado `checks`, verde/rojo. Tests.
- [ ] TASK-09: `generate-runner.ts` — fase repair condicional + re-validación única +
      outcome final (rojo canónico ⇒ repair skipped + informe). Tests.

## Frontend — UI

- [ ] TASK-10: `generate-work.component.ts` — detalles de fila de las fases nuevas. Tests.
- [ ] TASK-11: Desenlace en `generate-page.component.ts` — informe de validación accionable
      (comprobaciones, huecos, atribución del rojo). Tests.

## Validación

- [ ] TASK-12: Gates — suite del estudio, suite de `libs/generators`, `npm run web:build`
      del estudio y `/golden-diff` (no debería tocar oro: fill-flow-slots no emite plantillas).
      Actualizar ROADMAP (idea 37 → spec 75) y memoria.

---

## Regla del juego

Implementar UNA tarea, commit atómico, seguir. Modo autónomo (2026-07-30): avanzar sin
consultar, informe final de viabilidad.
