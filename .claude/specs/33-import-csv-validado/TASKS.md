# Tareas atómicas: Import CSV validado

> Cada tarea = un commit. TDD + gate de oro incremental. Diseño en REQUIREMENTS.

---

- [ ] TASK-01 — schema: `features.import` en ListDefinition
- [ ] TASK-02 — backend: `Import<Entity>UseCase` en dos fases (errores por fila / transacción)
      + handler + `POST /import` + wiring + tests emitidos
- [ ] TASK-03 — frontend: parser CSV mínimo (kernel) + `import(rows)` en el servicio
- [ ] TASK-04 — diálogo de import (fichero → preview → errores por fila → confirmar) +
      botón en la toolbar + «Descargar plantilla»
- [ ] TASK-05 — `project` estrena import + re-baseline de oro
- [ ] TASK-06 — gates: golden 6/6 · typecheck ambas composiciones · e2e con captura
