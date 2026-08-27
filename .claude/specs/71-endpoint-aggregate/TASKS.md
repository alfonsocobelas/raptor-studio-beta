# Tareas atómicas: Endpoint `aggregate`

> Cada tarea = un commit. TDD: test rojo → verde. En plantillas, el gate es el diff de oro.
> Lección de la spec 70: un kind se cablea ENTERO o la suite queda roja entre commits.

## Contrato compartido

- [ ] TASK-01: `AggregateOp` y la tabla op↔tipo de campo (`opAllowedOn`) en `@raptor/schema`, con
      tests por combinación. Es la regla que backend, composición y estudio consultan.

## Backend emitido

- [ ] TASK-02: `aggregatableFields` en `search-{entity}-config` — derivado del modelo (numéricos y
      fechas), tipado contra `PrimitiveProps`.
- [ ] TASK-03: firma `aggregate` en el puerto del repositorio + `AggregateInput`/`AggregateOutput`.
- [ ] TASK-04: `aggregateByCriteria` en el repositorio TypeORM (vacío → 0 en sum/distinct, null en
      avg/min/max; `Number()` sobre el numeric de PostgreSQL).
- [ ] TASK-05: `aggregateByCriteria` en el repositorio Mongoose (pipeline con el mismo match y el
      mismo borrado lógico).
- [ ] TASK-06: use case `Aggregate{Plural}UseCase` + handler, con la lista blanca y la tabla
      op↔tipo aplicadas ahí (no solo en el DTO).
- [ ] TASK-07: DTO de query + `@Get('aggregate')` ANTES de `:id`, con los roles de lectura.
- [ ] TASK-08: tests de integración por motor: sum, avg, min, max, distinct, vacío y con filtro.
- [ ] TASK-09: test e2e: 200 con valor, 400 campo fuera de la lista blanca, 400 op inválida,
      400 medida numérica sobre fecha, y sin permiso de lectura.

## App-schema y composición

- [ ] TASK-10: `KpiMeasure` gana las cinco medidas; validación en `define-app` (medida ≠ conteo
      exige `field` y prohíbe `ratio`).
- [ ] TASK-11: composición: el campo existe, es agregable y su tipo admite la operación — error al
      diseñar.

## Frontend emitido

- [ ] TASK-12: `_aggregate` en el servicio del panel; `_loadKpi` elige según la medida;
      `KpiValue.value` pasa a `number | null`.
- [ ] TASK-13: la tarjeta pinta «—» ante null y formatea según el tipo del campo.

## Estudio

- [ ] TASK-14: selector de Medida y de Campo en `kpi-config`, con los campos filtrados por medida
      y el campo invalidado al cambiar de medida; `ratio` fuera cuando la medida no es conteo.
- [ ] TASK-15: generabilidad por datos: sin campos agregables, solo se ofrece conteo.

## Validación

- [ ] TASK-16: golden: la app de oro estrena una suma y una media; `/golden-diff` limpio.
- [ ] TASK-17: `typecheck-emitted.sh` a 0 errores + suites de schema, generators y estudio, con el
      build AOT del estudio (el gate que faltó en la 70).
