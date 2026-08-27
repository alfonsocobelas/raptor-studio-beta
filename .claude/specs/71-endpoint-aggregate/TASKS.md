# Tareas atómicas: Endpoint `aggregate`

> Cada tarea = un commit. TDD: test rojo → verde. En plantillas, el gate es el diff de oro.
> Lección de la spec 70: un kind se cablea ENTERO o la suite queda roja entre commits.

## Contrato compartido

- [x] TASK-01: `AggregateOp` y la tabla op↔tipo de campo (`opAllowedOn`) en `@raptor/schema`, con
      tests por combinación. Es la regla que backend, composición y estudio consultan.

## Backend emitido

- [x] TASK-02: `aggregatableFields` en `search-{entity}-config` — derivado del modelo (numéricos y
      fechas), tipado contra `PrimitiveProps`.
- [x] TASK-03: firma `aggregate` en el puerto del repositorio + `AggregateInput`/`AggregateOutput`.
- [x] TASK-04: `aggregateByCriteria` en el repositorio TypeORM (vacío → 0 en sum/distinct, null en
      avg/min/max; `Number()` sobre el numeric de PostgreSQL).
- [x] TASK-05: `aggregateByCriteria` en el repositorio Mongoose (pipeline con el mismo match y el
      mismo borrado lógico).
- [x] TASK-06: use case `Aggregate{Plural}UseCase` + handler, con la lista blanca y la tabla
      op↔tipo aplicadas ahí (no solo en el DTO).
- [x] TASK-07: DTO de query + `@Get('aggregate')` ANTES de `:id`, con los roles de lectura.
- [x] TASK-08: tests de integración por motor: sum, avg, min, max, distinct, vacío y con filtro.
- [x] TASK-09: test e2e: 200 con valor, 400 campo fuera de la lista blanca, 400 op inválida,
      400 medida numérica sobre fecha, y sin permiso de lectura.

## App-schema y composición

- [x] TASK-10: `KpiMeasure` gana las cinco medidas; validación en `define-app` (medida ≠ conteo
      exige `field` y prohíbe `ratio`).
- [x] TASK-11: composición: el campo existe, es agregable y su tipo admite la operación — error al
      diseñar.

## Frontend emitido

- [x] TASK-12: `_aggregate` en el servicio del panel; `_loadKpi` elige según la medida;
      `KpiValue.value` pasa a `number | null`.
- [x] TASK-13: la tarjeta pinta «—» ante null y formatea según el tipo del campo.

## Estudio

- [x] TASK-14: selector de Medida y de Campo en `kpi-config`, con los campos filtrados por medida
      y el campo invalidado al cambiar de medida; `ratio` fuera cuando la medida no es conteo.
- [x] TASK-15: generabilidad por datos: sin campos agregables, solo se ofrece conteo.

## Validación

- [x] TASK-16: golden: la app de oro estrena una suma y una media; `/golden-diff` limpio.
- [x] TASK-17: `typecheck-emitted.sh` a 0 errores + suites de schema, generators y estudio, con el
      build AOT del estudio (el gate que faltó en la 70).

---

## Cómo se ejecutó (2026-08-27)

Cerrada en 8 commits. Dos desviaciones y tres defectos que la ejecución destapó:

**Desviación 1 — no hay e2e HTTP.** TASK-09 pedía un test e2e con códigos 400/403. El emitido no
tiene esa categoría: tiene tests de caso de uso con dobles y tests de integración por motor. El
test se escribió al nivel donde vive la regla —el caso de uso, que ES la frontera de confianza— y
cubre campo fuera de la lista blanca, inyección por el nombre del campo, operación inexistente y
sumar una fecha. `InvalidArgumentError` ya se traduce a 400 en el emitido.

**Desviación 2 — TASK-03..07 en un commit.** Igual que en la 70: el controller no compila sin el
handler, ni el handler sin el puerto, ni el puerto sin sus dos implementaciones.

### Defectos que la ejecución destapó

- **El doble de test del repositorio** no implementaba el método nuevo: 23 errores que ni el diff
  de oro ni la suite del plugin vieron. Los cazó `typecheck-emitted.sh`.
- **`MAX` de una columna `date` vuelve como CADENA** en node-postgres, no como Date: el `Number()`
  daba `NaN`. Se transporta como milisegundos de época y se formatea como fecha en pantalla.
  ⚠️ **Esa ruta no está verificada contra un motor vivo** (esta sesión no tenía Docker): la ruta
  numérica sí, por los tests de integración emitidos.
- **`?? 0` en el valor de la tarjeta** convertía «no hay dato» en cero. Un 0 en «Importe medio» es
  una afirmación falsa sobre el negocio: ahora se pinta «—».

### Trampas ya conocidas que volvieron a morder

Escapar `\${}` Y los backticks de los comentarios al emitir código dentro de un template literal
de `app.ts`. Costó dos ciclos, otra vez.

## Lo que queda para la spec 72

`groupBy` y `bucket`, y con ellos `sum-by`, `series-sum`, el sparkline de la tarjeta, y bajar
`count-by` de 8 peticiones a 1 y la serie de 12 a 1. El gasto del panel de oro va hoy en 27
peticiones, congelado en el spec emitido.
