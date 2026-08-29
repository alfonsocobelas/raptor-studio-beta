# TASKS — Spec 74: Botones de transición curables en la ficha

> Una tarea = un commit atómico en `develop`. TDD estricto; golden gate en las que tocan
> plantillas o generator.ts.

- [x] **TASK-01 — Contrato + generador: `hidden` filtra el botón de la ficha.** (2026-08-29, commits b3a5bd08 + 657b8e81)
  `hidden?: boolean` en `StateTransition` (schema + draft + `draftToResource`).
  `build-entrypoints`: `entry.transitions` y los métodos del componente de ficha filtran
  `hidden`; endpoint, use case, handler y kanban intactos. TDD sobre
  `state-machine-detail.spec.ts` + fixture de oro con una transición oculta + `/golden-diff`
  (re-baseline consciente).

- [x] **TASK-02 — El canvas deja de mentir: la ficha del lienzo pinta los botones.** (2026-08-29, commit 639e098a)
  `canvas-detail` deriva los botones visibles de la máquina del draft (orden + label),
  cromo del emitido (hooks de piel). Guard de deriva canvas↔build-entrypoints. Gate
  `npm run web:build`.

- [x] **TASK-03 — El gesto: sección «Acciones» en el inspector.** (2026-08-29, commit 7d3a3c02; el panel vive en design-panel como los demás bloques, no en el inspector de columnas)
  Con la ficha seleccionada: listar botones derivados, ojo (hidden), label editable,
  reordenar con ↑/↓; escribe en `resource.state.transitions` vía DesignStore (autosave).
  Transición oculta atenuada en el ciclo de vida. Tests con `@Input()`/`@Output()` +
  `web:build`.

- [x] **TASK-04 — Verificación end-to-end con inmobiliaria.** (2026-08-29)
  Hecho: `retirar` oculto en el diseño → POST `/api/v1/studio/generate` OK (8,9 s) → la ficha
  emitida no tiene botón ni método `retirar` (sí publicar/reservar/vender/reactivar), el spec
  emitido no lo ejercita (8/8 verdes), el controller conserva `POST :id/retirar` y la
  transición ejecutada por HTTP con sesión admin devuelve 204 y deja el inmueble en
  `retirado`. Matices: (a) inmobiliaria no tiene kanban — ese caso lo cubre la fixture de oro
  de contract; (b) el `ng build` completo de la app está roto por huérfanos `*-trash` previos
  a esta spec (ROADMAP idea 40) y el borrado manual está fuera de mi permiso — pendiente
  `rm` de los 6 ficheros y build limpio; la comprobación visual en navegador queda coja por
  la trampa del bundle viejo hasta entonces.
