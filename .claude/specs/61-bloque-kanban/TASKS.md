# Tareas atómicas: Bloque Kanban (22F)

> Cada tarea = un commit en `develop`. TDD estricto; receta de la spec 59.

## Schema y generador

- [x] **TASK-01**: Tests + `KanbanDefinition` en `resource-types.ts` + validación en
      `define-resource.ts` (field existe y es enum).
- [x] **TASK-02**: Tests + `renderKanban` en `build-substitutions.ts` (labelField default,
      columnas con etiquetas, stateDriven, moves desde las transiciones).
- [x] **TASK-03**: Tests (`kanban.spec.ts`) + plantilla `files-kanban/` + condición en
      `resource.ts`. Drag nativo: transiciones si stateDriven, update si enum normal
      (verificar DTO parcial), columnas ilegales atenuadas, sin optimismo.
- [x] **TASK-04**: Tests + `KanbanPage`, sufijo `' · tablero'`, derivación composeFlat,
      `kanbanPath`/`kanbanRoute` antes de `:id`.

## Frontera y estudio

- [ ] **TASK-05**: Tests + flag `kanban` en `draft-resource.ts` + cruce en `design-to-app.ts`
      (sin field no cruza) + `'kanban'` en `BlockKind`.
- [ ] **TASK-06**: Tests + `GENERABLE_BLOCKS` + `columnsField` en `DesignBlock` + design-store
      (default campo de estado > primer enum; flag; `setKanbanConfig`; removeBlock).
- [ ] **TASK-07**: Paleta (`lucideSquareKanban`) + `canvas-kanban.component.ts` (columnas con
      tarjetas de muestra) + badge sin enum.
- [ ] **TASK-08**: Panel del bloque `kanban-config.component.ts` (Columnas / Etiqueta) en la
      pestaña Componente.

## Golden y verificación

- [ ] **TASK-09**: `kanban: { field: 'status' }` en `contract` + páginas en `golden.app.ts` y
      `demo.app.ts`; regenerar, revisar diff a mano, congelar. `/golden-diff` 6/6 vacíos.
- [ ] **TASK-10**: Suites (generators/schema/estudio) + typecheck-emitted 0 errores + smoke
      visual del estudio (paleta, badge, panel, tablero en canvas).

---

## Regla del juego

Implementar UNA tarea, commit, seguir. Si una tarea crece (>~150 líneas), partirla.
