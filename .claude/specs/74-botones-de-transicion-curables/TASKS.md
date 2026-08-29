# TASKS — Spec 74: Botones de transición curables en la ficha

> Una tarea = un commit atómico en `develop`. TDD estricto; golden gate en las que tocan
> plantillas o generator.ts.

- [ ] **TASK-01 — Contrato + generador: `hidden` filtra el botón de la ficha.**
  `hidden?: boolean` en `StateTransition` (schema + draft + `draftToResource`).
  `build-entrypoints`: `entry.transitions` y los métodos del componente de ficha filtran
  `hidden`; endpoint, use case, handler y kanban intactos. TDD sobre
  `state-machine-detail.spec.ts` + fixture de oro con una transición oculta + `/golden-diff`
  (re-baseline consciente).

- [ ] **TASK-02 — El canvas deja de mentir: la ficha del lienzo pinta los botones.**
  `canvas-detail` deriva los botones visibles de la máquina del draft (orden + label),
  cromo del emitido (hooks de piel). Guard de deriva canvas↔build-entrypoints. Gate
  `npm run web:build`.

- [ ] **TASK-03 — El gesto: sección «Acciones» en el inspector.**
  Con la ficha seleccionada: listar botones derivados, ojo (hidden), label editable,
  reordenar con ↑/↓; escribe en `resource.state.transitions` vía DesignStore (autosave).
  Transición oculta atenuada en el ciclo de vida. Tests con `@Input()`/`@Output()` +
  `web:build`.

- [ ] **TASK-04 — Verificación end-to-end con inmobiliaria.**
  Ocultar `retirar` desde el inspector, regenerar (POST studio/generate), comprobar por
  navegador: ficha sin el botón, orden/labels curados respetados, kanban sigue arrastrando,
  endpoint de la transición oculta responde. Anotar defectos en el generador, nunca parchear
  la app generada.
