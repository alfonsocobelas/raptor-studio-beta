# Tareas atómicas: Historial de cambios

> Cada tarea = un commit. TDD (specs del plugin) + gate de oro incremental.

---

- [ ] TASK-00 — deuda spec 26/27: `typecheck-emitted` incluye `libs/frontend` y
      `apps/frontend-app` (el dialog roto dio «0 errores» dos días)
- [ ] TASK-01 — schema: `history?: boolean` en ResourceDefinition
- [ ] TASK-02 — kernel: `AuditEvent` + `AuditTrailPort` + adapters TypeORM/Mongoose +
      tabla global en la migración (solo si algún modelo trae history) + binding
- [ ] TASK-03 — use cases register/update/remove/restore registran eventos (update con diff)
- [ ] TASK-04 — `GET /:id/history` + handler + use case + tests emitidos
- [ ] TASK-05 — servicio frontend `history(id)` + timeline en la ficha
- [ ] TASK-06 — `project` estrena history + re-baseline de oro
- [ ] TASK-07 — gates: golden 6/6 · typecheck ampliado 0 errores · e2e con captura
