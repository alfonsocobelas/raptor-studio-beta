# Tareas atómicas: Vista Gantt / cronograma

> Cada tarea = un commit atómico. TDD: tests del schema y de emisión primero + gate de oro.

---

- [ ] TASK-01 — schema: `GanttDefinition` + validación (`gantt` sin `period` rechazado;
      `title` desconocido rechazado) — TDD en `libs/schema`
- [ ] TASK-02 — app-schema: página `{ kind: 'gantt' }` + `composeFlat` deriva
      «· cronograma» de `model.gantt`
- [ ] TASK-03 — emisión: `renderGantt` (titleField/startField/endField) + componente
      `files-gantt` + emisión condicionada a `model.gantt`
- [ ] TASK-04 — ruta `<ruta>/cronograma` antes de `:id` + nav (espejo de la galería)
- [ ] TASK-05 — `contract` declara `gantt: {}` + re-baseline de oro deliberado
- [ ] TASK-06 — gates: typecheck del emitido + e2e con captura en navegador
