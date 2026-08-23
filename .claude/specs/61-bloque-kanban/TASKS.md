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

- [x] **TASK-05**: Tests + flag `kanban` en `draft-resource.ts` + cruce en `design-to-app.ts`
      (sin field no cruza) + `'kanban'` en `BlockKind`.
- [x] **TASK-06**: Tests + `GENERABLE_BLOCKS` + `columnsField` en `DesignBlock` + design-store
      (default campo de estado > primer enum; flag; `setKanbanConfig`; removeBlock).
- [x] **TASK-07**: Paleta (`lucideSquareKanban`) + `canvas-kanban.component.ts` (columnas con
      tarjetas de muestra) + badge sin enum.
- [x] **TASK-08**: Panel del bloque `kanban-config.component.ts` (Columnas / Etiqueta) en la
      pestaña Componente.

## Golden y verificación

- [x] **TASK-09**: `kanban: { field: 'status' }` en `contract` + páginas en `golden.app.ts` y
      `demo.app.ts`; regenerar, revisar diff a mano, congelar. `/golden-diff` 6/6 vacíos.
- [x] **TASK-10**: Suites (generators/schema/estudio) + typecheck-emitted 0 errores + smoke
      visual del estudio (paleta, badge, panel, tablero en canvas).

---

## Regla del juego

Implementar UNA tarea, commit, seguir. Si una tarea crece (>~150 líneas), partirla.

---

## Notas de cierre (2026-08-24)

- Suites: generators 977 ✅ · schema 193 ✅ · estudio 904 ✅. `/golden-diff` 6/6 vacíos.
  `typecheck-emitted --app=golden`: 0 errores (kanban de contract incluido).
- Smoke visual 5/5 (`tools/smoke-kanban.ts` + `e2e-61-kanban.png`). El smoke cazó dos
  defectos reales: `kanban` faltaba en GENERABLE_BLOCKS (badge eterno) y el bloque sin
  enum pintaba vacío (sin altura ⇒ ni badge visible) — ahora tiene estado vacío con pista.
- El drag del EMITIDO (transición real contra backend) queda verificado estructuralmente
  (specs del generador + typecheck); el gesto end-to-end con BD pide el e2e con Docker,
  pendiente como siempre ([[entorno-node-y-servidores]]).
- Trampa de smokes: el autosave del estudio acumula estado entre corridas — borrar
  `.studio/designs/mi-app.json` antes de cada corrida o los índices del inspector mienten.
