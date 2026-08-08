# Tareas atómicas: Vista Gantt / cronograma

> Cada tarea = un commit atómico. TDD: tests del schema y de emisión primero + gate de oro.

---

- [x] TASK-01 — schema: `GanttDefinition` + validación (`gantt` sin `period` rechazado;
      `title` desconocido rechazado) — TDD en `libs/schema`
- [x] TASK-02 — app-schema: página `{ kind: 'gantt' }` + `composeFlat` deriva
      «· cronograma» de `model.gantt`
- [x] TASK-03 — emisión: `renderGantt` (titleField/startField/endField) + componente
      `files-gantt` + emisión condicionada a `model.gantt`
- [x] TASK-04 — ruta `<ruta>/cronograma` antes de `:id` + nav (espejo de la galería)
- [x] TASK-05 — `contract` declara `gantt: {}` + re-baseline de oro deliberado
- [x] TASK-06 — gates: typecheck del emitido (0 errores) · e2e con captura ✅ 2026-08-08
      tras DESBLOQUEAR la spec 04 en esta misma sesión (enums reales, dtoName, módulo de
      labels, mocks con literales). Evidencias: `apps/studio/e2e-17-gantt-contratos.png`
      (dos barras escalonadas con rejilla mensual) y `e2e-18-dialog-contrato.png` (el dialog
      de contrato abre con selects tipados y labels en español). De propina, los campos del
      period se siembran como intervalos escalonados: el cronograma nace vivo.
