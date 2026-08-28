# Spec 73 — Tareas

> Una tarea = un commit atómico en `develop`. TDD: test rojo antes de producción; para plantillas,
> el diff de oro. Gates por tarea: suite afectada en verde; además `npm run web:build` cuando toca
> el estudio y `/golden-diff` cuando toca plantillas o `generator.ts`.

- [x] **TASK-01 — App-schema: kind `kpi-row` + normalización de los sueltos**
      `libs/schema`: tipo `kpi-row` con `cells`; `normalizeDashboardBlocks` envuelve `metrics`,
      `kpi`, `top-n`, `count-by` y `series` en filas de una celda (metrics → una celda por
      recurso); `defineApp` valida celdas. Tests de normalización e idempotencia.

> Nota (2026-08-28): las TASK-02…06 aterrizaron en UN commit — quitar los kinds sueltos de
> `BlockKind` obligaba a que modelo, frontera, paleta, lienzo y config compilaran juntos.

- [x] **TASK-02 — Modelo de diseño: `KpiCell` + `normalizeDesignPages`**
      `apps/studio/libs/shared/domain`: `BlockKind` reducido, `items` en el bloque `kpis`,
      migración pura de páginas (sueltos → fila de una celda; `resources` → celdas contador).
      Tests de migración. Compila todo lo que consumía los kinds viejos (frontera incluida,
      aunque su emisión llega en TASK-03).

- [x] **TASK-03 — Frontera: `panelBlocks` emite `kpi-row`**
      `design-to-app.ts` traduce `kpis.items` a celdas reutilizando los mapeos actuales; celda
      incompleta se omite; fila vacía no se emite. Tests de la frontera actualizados.

- [x] **TASK-04 — Estudio: paleta única + drop + normalización en las entradas**
      Paleta con una sola entrada «KPIs»; `block-drop` crea la fila vacía; carga inicial y
      `applyExternalDesign` pasan por `normalizeDesignPages`. Tests de store y drop migrados.

- [x] **TASK-05 — Lienzo: fila con celdas y cuadrado «+»**
      `canvas-kpi-row` con grid por spans, renders de celda reutilizados, menú «+» de 5 opciones
      (una por tipo de celda), marca de celda incompleta. `npm run web:build` en verde.

- [x] **TASK-06 — Config por celda**
      Selección de celda en el store; `kpi-config`, `top-n-config` y `chart-config` retargetados;
      quitar celda. Tests de los paneles.

- [x] **TASK-07 — Generador: emisión del grid por fila**
      `app.ts`/`composition.ts` + plantilla del dashboard: un grid por `kpi-row`, spans por tipo,
      responsive. App-schema de oro reescrito con `kpi-row`; re-baseline y golden limpio;
      `typecheck-emitted.sh` a 0.

- [x] **TASK-08 — Barrido final**
      Smokes del estudio (drag incluido) migrados, suites completas, `web:build`, golden, y
      revisión de que los diseños guardados cargan (aguas/peritajes) sin marcar nada roto.
      Nuevo smoke frío `apps/studio/tools/smoke-migrate-designs.ts`: los 10 diseños de
      `.studio/designs` migran a filas y pasan `defineApp`. Pendiente de humano: verificación
      visual del «+» en el navegador (el estudio necesita `nx build schema` fresco y reiniciar
      studio-api si estaba levantado).
