# Tareas atómicas: Import CSV validado

> Cada tarea = un commit. TDD + gate de oro incremental. Diseño en REQUIREMENTS.

---

- [x] TASK-01 — schema: `features.import` en ListDefinition
- [x] TASK-02 — backend: `Import<Entity>UseCase` en dos fases (errores por fila / transacción)
      + handler + `POST /import` + wiring + tests emitidos
- [x] TASK-03 — frontend: parser CSV mínimo (kernel) + `import(rows)` en el servicio
- [x] TASK-04 — diálogo de import (fichero → preview → errores por fila → confirmar) +
      botón en la toolbar + «Descargar plantilla»
- [x] TASK-05 — `project` estrena import + re-baseline de oro
- [x] TASK-06 — gates: golden 6/6 · typecheck ambas composiciones · e2e con captura

---

## Cierre (2026-08-09)

- Gates: golden 6/6 · typecheck 0 en ambas composiciones · suite del plugin 492 · suite unit
  emitida 389/389 (incluye los tests del import) · e2e con capturas: `e2e-21-import-errores.png`
  (fila 1 rechazada por su propio VO: «Project name must be at least 3 characters», nada
  importado) y `e2e-22-import-ok.png` (corregido, las dos filas entran y aparecen en el listado).
- Hallazgo arreglado: la fase 1 cazaba solo BusinessRuleViolationError y los guards de los
  VOs COMPARTIDOS lanzan InvalidArgumentError (hermana, no hija) — ahora caza BaseCustomError.
  Lo detectó la suite emitida en la primera ejecución real.
- Limitaciones anotadas: parser sin saltos de línea embebidos; cabeceras = nombres de campo
  (sin mapeo); import no declarable aún desde el estudio.
