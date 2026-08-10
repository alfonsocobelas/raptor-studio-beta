# Tareas atómicas: Borrado suave canónico

> Cada tarea = un commit atómico en develop. Orden TDD: test del generador en rojo →
> plantilla/lógica → verde → siguiente. El golden-diff corre en cada tarea que toque
> emisión; los diffs esperados se acumulan y el re-baseline es UNA tarea propia al final.

---

## Contrato y cimientos

- [ ] **TASK-01**: `softDelete` cambia su defecto a `true` en el schema (`resource-types.ts`
      JSDoc + `build-substitutions`), `material` declara `softDelete: false`. Tests: un
      modelo mudo emite soft delete; uno con `false` emite el DELETE físico de hoy.
- [ ] **TASK-02**: árbol de arrastre en `build-substitutions`: derivar por entidad los
      niveles `[{ entity, fkField, parentLevel }]` desde el registro (solo hijos suaves).
      Tests con el registro de la demo: cliente → [instalacion] → [parte]; parte → [].
- [ ] **TASK-03**: columna `deleted_op` (uuid, null) en entidad TypeORM + migración de
      fábrica de toda entidad suave. Test: la migración emitida crea ambas columnas y
      NINGÚN `ON DELETE CASCADE` aparece.

## Backend

- [ ] **TASK-04**: port del repositorio: `remove(id, op)` + `removeWhereParent(ids, op)` +
      `restoreByOp(op)` y adapter TypeORM. Tests emitidos del repo incluidos.
- [ ] **TASK-05**: use case de borrado transaccional (árbol estático dentro de
      `runInTransaction`, evento de historial dentro de la tx si `history`). Medir aquí la
      DI de ports hijo→padre y exportar los que falten. Test emitido: fallo a mitad ⇒
      rollback completo.
- [ ] **TASK-06**: restore por operación: DTO del trash expone `deletedOp`, el POST /restore
      revierte el árbol en transacción. Test emitido: hijo borrado aparte NO vuelve.
- [ ] **TASK-07**: adapter Mongoose (`deletedAt`+`deletedOp`, `updateMany`, sesión replSet).
      Si el TransactionManager mongo no existe en el kernel emitido, entra aquí primero.

## Frontend

- [ ] **TASK-08**: copy del diálogo por sustitución (`deleteCopy`): archivará/relacionados/
      papelera para suaves, permanencia solo en físicas. Test del generador por caso.
- [ ] **TASK-09**: verificación de filtrado de borrados en TODAS las superficies (listado,
      lookup, KPIs, widgets, export, galería, gantt, related-tables) — tests de integración
      emitidos donde falten.

## Gates finales

- [ ] **TASK-10**: `typecheck:emitted` a 0 errores + suites completas (generadores, estudio).
- [ ] **TASK-11**: re-baseline deliberado del golden (4 referencias + 2 apps), diff revisado
      a mano, commit `chore(golden)` propio.
- [ ] **TASK-12**: regenerar la demo Solaris y e2e de los tres escenarios del REQUIREMENTS
      (padre arrastra · restore devuelve el arrastre exacto · material borra físico), con
      capturas e2e-3x.
