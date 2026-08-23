# Tareas atómicas: auth por defecto

> Cada tarea = un commit atómico en develop.

- [x] **TASK-01** (`d4e11eed`): Tests + generador: `internal` en `SlotProvider`, default `single-tenant`,
      error claro con `--auth=none`, downgrade con WARN en mongo, `auth` fuera de
      `schema.json`/`slots.json`, barrido de specs que asumían el default antiguo. Golden sin
      re-baseline (gate app pasa a `--plugins=email`).
- [x] **TASK-02** (`ec0ebc2c`): Tests + estudio: el wizard pierde el grupo Autenticación (sale solo del
      manifiesto), hint de mongo "Sin autenticación hasta el port a Mongoose", comando emitido
      sin `--auth=`.
- [x] **TASK-03** (verificada 2026-08-23): Verificación: typecheck-emitted sin flags de auth; generar postgres (con
      login) y mongo (aviso, sin auth) en vivo; `--auth=none` devuelve el error esperado.
      Cierre.

> Verificado en vivo: postgres sin flags emite el módulo de auth; mongo avisa del port a
> Mongoose y no emite IAM; --auth=none corta con el mensaje de la retirada; typecheck-emitted
> de la app de oro a 0 errores sin flag. Golden intacto en toda la spec (cero re-baselines).
