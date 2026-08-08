# Tareas atómicas: Historial de cambios

> Cada tarea = un commit. TDD (specs del plugin) + gate de oro incremental.

---

- [x] TASK-00 — deuda spec 26/27: `typecheck-emitted` incluye `libs/frontend` y
      `apps/frontend-app` (el dialog roto dio «0 errores» dos días)
- [x] TASK-01 — schema: `history?: boolean` en ResourceDefinition
- [x] TASK-02 — kernel: `AuditEvent` + `AuditTrailPort` + adapters TypeORM/Mongoose +
      tabla global en la migración (solo si algún modelo trae history) + binding
- [x] TASK-03 — use cases register/update/remove/restore registran eventos (update con diff)
- [x] TASK-04 — `GET /:id/history` + handler + use case + tests emitidos
- [x] TASK-05 — servicio frontend `history(id)` + timeline en la ficha
- [x] TASK-06 — `project` estrena history + re-baseline de oro
- [x] TASK-07 — gates: golden 6/6 · typecheck ampliado 0 errores · e2e con captura

---

## Cierre (2026-08-08)

- Gates: golden 6/6 vacío · typecheck del emitido (backend+frontend) 0 errores · suite unit
  emitida 387/387 · e2e vivo: ciclo crear → editar → borrar → restaurar registrado y la
  ficha pinta la timeline con el diff del update (`name: Name seed 1 → Rollout S4HANA fase 2`)
  y fechas localizadas. Evidencia: `apps/studio/e2e-19-historial-ficha.png`.
- El typecheck ampliado (TASK-00) cazó sus dos primeros errores reales en esta misma spec
  (insert() vs jsonb; primitives sin index signature) — pagado en la primera hora.
- Pendiente anotado: el actor llegará con la integración de la ranura auth; integración
  Mongoose del historial sin ejercitar contra replSet (igual que el resto de la suite mongo).
