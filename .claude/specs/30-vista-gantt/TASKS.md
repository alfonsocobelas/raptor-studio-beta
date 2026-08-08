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
- [ ] TASK-06 — gates: typecheck del emitido ✅ (0 errores, gantt incluido) · e2e con captura
      **BLOQUEADO por la spec 04**: el único modelo con `period` es `contract` y su dialog
      revienta al servir (`ContractTypeEnum` es un type union, el dialog lo usa como valor) —
      mismo bloqueo que dejó a medias los dialogs de contract/project. Al cerrar la spec 04,
      arrancar la app de oro y capturar `/sap-licensing/contracts/cronograma`. Los demás gates
      (golden vacío 6/6, suite 449, typecheck) sí corrieron.
