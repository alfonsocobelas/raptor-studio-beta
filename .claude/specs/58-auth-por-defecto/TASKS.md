# Tareas atómicas: auth por defecto

> Cada tarea = un commit atómico en develop.

- [ ] **TASK-01**: Tests + generador: `internal` en `SlotProvider`, default `single-tenant`,
      error claro con `--auth=none`, downgrade con WARN en mongo, `auth` fuera de
      `schema.json`/`slots.json`, barrido de specs que asumían el default antiguo. Golden sin
      re-baseline (gate app pasa a `--plugins=email`).
- [ ] **TASK-02**: Tests + estudio: el wizard pierde el grupo Autenticación (sale solo del
      manifiesto), hint de mongo "Sin autenticación hasta el port a Mongoose", comando emitido
      sin `--auth=`.
- [ ] **TASK-03**: Verificación: typecheck-emitted sin flags de auth; generar postgres (con
      login) y mongo (aviso, sin auth) en vivo; `--auth=none` devuelve el error esperado.
      Cierre.
