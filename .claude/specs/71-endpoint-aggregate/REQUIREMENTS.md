# Spec 71: Endpoint `aggregate` y las medidas de verdad

## Contexto de negocio

La spec 70 subió al lienzo la tarjeta KPI, pero con una sola medida: **contar**. Y lo primero que
pregunta un cliente no es cuántas facturas tiene, es **cuánto ha facturado**. Sumar, promediar,
sacar el máximo o contar distintos no se puede falsear con el listado: `pageSize=1` solo devuelve
`total`, así que hoy el panel sabe cuántos hay y nunca cuánto valen.

Esta spec abre **un endpoint de agregación por recurso** y con él las medidas reales. Es el salto
que la 70 dejó apuntado y el que justifica el resto: el mismo endpoint que hoy responde una suma
es el que mañana (spec 72) colapsará `count-by` de 8 peticiones a 1 y la serie de 12 a 1.

El campo por el que se agrega viaja **desde HTTP hasta el SQL**, así que la decisión central de
esta spec no es la agregación: es la **lista blanca en el borde**.

## Alcance: fase A

Esta spec entrega la agregación de UN valor. Se deja fuera, deliberadamente, el agrupado:

```
spec 71 (esta)   op = sum | avg | min | max | distinct        → un número
spec 72          + groupBy (por enum) y bucket (por mes)      → una serie
                   y con ellos: sum-by, series-sum, sparkline,
                   y count-by/series bajan a UNA petición
```

Partirlo así no es cautela: el agrupado cambia la FORMA de la respuesta (de número a lista) y con
ella el contrato del front y tres kinds de bloque. Mezclarlo sería una spec que no se puede cerrar
de una pieza.

## User stories (formato EARS)

- WHEN el front pide `GET /api/v1/{plural}/aggregate?op=sum&field=totalValue` THEN la API responde
  `{ "value": 128400 }` con la suma de ese campo sobre TODOS los registros vivos del recurso.
- WHEN la petición incluye `filters` THEN la suma se acota a los registros que los cumplen, con la
  misma sintaxis y los mismos operadores que el listado (un solo lenguaje de filtro en la app).
- IF el recurso tiene borrado lógico THEN los registros borrados NO entran en ninguna agregación,
  igual que no entran en el listado ni en el conteo.
- IF `field` no está en la lista blanca de campos agregables del recurso THEN la API responde
  **400** y el nombre no llega a la consulta. La lista la emite el generador desde el modelo; no se
  deriva en tiempo de ejecución ni se acepta lo que venga.
- IF `op` no es una de las cinco operaciones THEN 400.
- IF `op` es `sum`, `avg`, `min` o `max` y el campo no es numérico ni fecha THEN 400: la media de
  un texto no es una pregunta con respuesta.
- IF la agregación no encuentra ningún registro THEN `sum` y `distinct` responden `0`, y `avg`,
  `min` y `max` responden `null` — porque la media de nada no es cero, y decir cero sería mentir.
- WHILE se resuelve la agregación THEN se respeta la autorización del recurso: quien no puede
  listar tampoco puede agregar (misma capacidad, no una nueva).
- WHEN el diseño declara un `kpi` con `measure: 'sum'` y un campo THEN la app emitida pinta la
  tarjeta con ese número formateado según el tipo del campo (importe con su moneda, fecha como
  fecha), y con los modificadores de la 70 que sigan teniendo sentido.
- IF la medida no es `count` THEN `ratio` deja de ofrecerse: un porcentaje de una suma sobre otra
  suma es otra pregunta, y mezclarlas daría un número que nadie sabe leer.
- WHEN el usuario elige la medida en el panel del estudio THEN solo se ofrecen los campos que esa
  medida admite, y el bloque se marca «aún no generable» si el recurso no tiene ninguno.

## Criterios de aceptación

- [ ] Endpoint `GET /api/v1/{plural}/aggregate` emitido por el generador, con su DTO validado
      (`op`, `field`, `filters`) y la lista blanca de campos como constante emitida.
- [ ] Use case `Aggregate{Entity}UseCase` con su test: delega en el repositorio y no conoce HTTP.
- [ ] Método `aggregate` en el puerto del repositorio + implementación en **las dos** ranuras de
      motor (TypeORM y Mongoose), con el borrado lógico excluido en ambas.
- [ ] Test de integración por motor: suma, media, máximo, mínimo, distintos, conjunto vacío y
      filtro aplicado.
- [ ] Test e2e: 200 con el valor, 400 por campo fuera de la lista blanca, 400 por operación
      inválida, 400 por medida numérica sobre campo de texto, y 403/401 sin permiso de listado.
- [ ] App-schema: `KpiMeasure` gana `sum | avg | min | max | distinct`; validación de que la medida
      distinta de `count` exige `field` y prohíbe `ratio`.
- [ ] Composición: el campo de la medida existe, es agregable y su tipo admite la operación —
      error al DISEÑAR, no al compilar.
- [ ] Emitido: `_aggregate` en el servicio del panel; la tarjeta formatea según el tipo del campo;
      el gasto del panel sigue congelado en el spec emitido.
- [ ] Estudio: selector de Medida y de Campo en `kpi-config`, con los campos filtrados por medida;
      generabilidad por datos.
- [ ] Golden: la app de oro estrena una suma y una media; `/golden-diff` limpio.
- [ ] `typecheck-emitted.sh` a 0 errores; suites del plugin, del schema y del estudio en verde.

## Referencias del proyecto de referencia

- Repositorio compartido de cada motor: `tools/golden-fixtures/app/…/typeorm/typeorm.repository.ts`
  (`countByCriteria` es el molde exacto) y `…/app-mongo/…/mongoose/mongoose.repository.ts`.
- Criteria y operadores: `…/shared/domain/query/` (filtro, operador, criteria).
- La tarjeta y su panel: spec 70 (`.claude/specs/70-bloque-kpi-configurable/`).

## Reglas de negocio aplicables

- **Validar en el borde** (CLAUDE.md): el nombre de campo que llega por HTTP nunca se interpola en
  una consulta sin pasar por una lista blanca emitida desde el modelo.
- **Autorización razonada**: agregar es leer. No se inventa una capacidad nueva; se exige la del
  listado del recurso.
- **Un solo lenguaje de filtro**: la agregación reusa `filters` tal cual. Nada de una segunda
  sintaxis para lo mismo.
- «Generar, no interpretar»: una agregación con dos campos, una fórmula o un `HAVING` se escribe a
  mano sobre el código emitido.

## Fuera de scope (deliberado)

- `groupBy` y `bucket`, y con ellos `sum-by`, `series-sum` y el sparkline: spec 72.
- Agregaciones sobre campos de OTRO recurso (joins) y sobre relaciones.
- Cachés y materializaciones: la spec 71 mide, no optimiza.
- Percentiles, medianas y desviaciones: no hay caso de negocio pedido y su SQL no es portable
  entre los dos motores.
- Tiempos de ciclo: siguen necesitando histórico de transiciones, que no existe.
