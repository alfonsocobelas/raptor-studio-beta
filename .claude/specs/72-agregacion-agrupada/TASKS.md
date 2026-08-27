# Tareas atómicas: agregación agrupada

> Un kind se cablea entero. La lección de las specs 70 y 71 ya está pagada dos veces.

## Contrato

- [ ] TASK-01: `op=count` entra en el catálogo de operaciones (schema + emitido) y `field` pasa a
      ser opcional para él.
- [ ] TASK-02: `groupableFields` emitido por recurso (enums y referencias filtrables).

## Backend emitido

- [ ] TASK-03: `aggregateGrouped` en el puerto + `GroupedSpec`/`AggregateGroups`, y la respuesta
      gana `groups` y `truncated`.
- [ ] TASK-04: adapter TypeORM (`GROUP BY`, `date_trunc` para el bucket, techo 51).
- [ ] TASK-05: adapter Mongoose (`$group`, `$dateToString`, mismo techo).
- [ ] TASK-06: caso de uso: valida `groupBy`/`bucketField`, prohíbe los dos ejes, rellena los meses
      vacíos y traduce el techo a `truncated`.
- [ ] TASK-07: DTO de query con los parámetros nuevos.
- [ ] TASK-08: tests emitidos: integración por motor (enum, mes con huecos, techo) y caso de uso
      (campo no agrupable, dos ejes, count sin campo).

## El ahorro

- [ ] TASK-09: `count-by` emitido con UNA petición.
- [ ] TASK-10: `series` emitido con UNA petición.
- [ ] TASK-11: el gasto del panel de oro cae de 27 a 13, congelado en el spec emitido.

## Kinds nuevos

- [ ] TASK-12: `measure` + `field` en `count-by` y `series` (= `sum-by` y `series-sum`), con
      validación y composición.
- [ ] TASK-13: `sparkline` en el bloque `kpi`.
- [ ] TASK-14: estudio: selector de Medida en los paneles de barras y de serie; sparkline en el
      panel del KPI; previews del lienzo.

## Validación

- [ ] TASK-15: golden limpio + `typecheck-emitted.sh` 0 errores + suites + build AOT del estudio.
