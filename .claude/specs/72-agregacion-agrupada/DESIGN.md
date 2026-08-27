# Diseño técnico: `groupBy` y `bucket`

## Contrato de respuesta: UNA forma, no dos

```ts
export interface AggregateOutput {
  /** El valor sobre TODO el conjunto filtrado; null cuando no hay dato */
  value: number | null
  /** El desglose, presente solo si se pidió agrupar */
  groups?: { key: string; value: number | null }[]
  /** El desglose venía recortado por el techo de grupos */
  truncated?: boolean
}
```

Una sola forma y no una unión: el controller declara un tipo, el front lee `value` siempre y
`groups` cuando lo pidió. Y el total sale gratis en la misma consulta, que es justo lo que la barra
de un desglose necesita para calcular su porcentaje.

## Dos listas blancas, no una

`aggregatableFields` (spec 71) dice **qué se puede medir**: números y fechas. Agrupar es otra
pregunta: se agrupa por **enums y referencias**, nunca por un importe (un `groupBy amount` produce
un grupo por fila). Por eso se emite una lista aparte:

```ts
const CONTRACT_GROUPABLE_FIELDS = ['contractType', 'status', 'source', 'customerId'] as const
```

Regla de emisión: campos con `vo.values` (enum) o con `relation`, que además sean `filterable`.

`bucketField` no necesita lista propia: es un campo fecha, y esos ya están en `aggregatableFields`
con `kind: 'date'`.

## Endpoint

```
GET /api/v1/{plural}/aggregate
  ?op=count|sum|avg|min|max|distinct
  &field=<medido>            (obligatorio salvo op=count)
  &groupBy=<campo>           (excluyente con bucket)
  &bucket=month&bucketField=<fecha>&months=12
  &filters=[…]
```

`op=count` entra en el catálogo de operaciones. Es lo que permite que `count-by` —hoy 8 peticiones—
sea una sola, y no obliga a inventar un segundo endpoint para contar agrupando.

## Repositorio: `aggregateGrouped`

```ts
abstract aggregateGrouped(criteria: Criteria, spec: GroupedSpec): Promise<AggregateGroups>
```

**TypeORM**: `GROUP BY` sobre la columna, o sobre `date_trunc('month', columna)` para el bucket.
`COUNT(*)` cuando `op` es `count`. El techo se aplica con `ORDER BY value DESC LIMIT 51`: se piden
51 para saber si sobraba y poder decir `truncated`.

**Mongoose**: el mismo pipeline con `$group: { _id: '$campo' }`, y para el bucket
`$dateToString: { format: '%Y-%m', date: '$campo' }`. Mismo `$sort` + `$limit: 51`.

**Los meses vacíos los rellena el dominio, no el motor**: una serie con huecos no se puede dibujar,
y ninguno de los dos motores genera filas que no existen. La lista de meses se calcula en el caso
de uso (que sabe cuántos se pidieron) y los grupos del motor se vuelcan sobre ella. En `avg`, `min`
y `max` el hueco se OMITE en vez de rellenarse con 0: la media de un mes sin datos no es cero.

## Emitido: de 27 peticiones a 13

| bloque       | antes | después |
| ------------ | ----- | ------- |
| `count-by`   | 8     | 1       |
| `series`     | 12    | 1       |
| `kpi` conteo | 1     | 1       |
| `sparkline`  | (12)  | +0 (va en la misma llamada de la serie) |

**13 y no 9**: los 9 salían de contar mal — cada tarjeta KPI es al menos una petición por sí
misma, y el panel de oro tiene ocho entre las seis tarjetas (dos gastan dos por comparar o por el
porcentaje). Lo que esta spec ahorra son las 3 del desglose y las 11 de la serie.

El servicio emitido cambia `_counts` y `_series` por una llamada a `_grouped`. **Los componentes no
cambian**: `bars()` y `points()` siguen recibiendo la misma forma, porque el servicio mapea los
grupos al array que ya esperaban. Eso mantiene el diff de oro pequeño y el riesgo bajo.

## Kinds nuevos

- `sum-by`: hermano de `count-by` con `measure` + `field`. Mismas barras, otro número.
- `series-sum`: hermano de `series` con `measure` + `field`.
- `kpi.sparkline: boolean`: la tarjeta añade su mini-serie; exige `window` o un campo fecha.

En el estudio, `sum-by` y `series-sum` NO son dos entradas más de paleta: son el mismo bloque
`count-by`/`series` con un selector de Medida en su panel — igual que la 71 hizo con el KPI. Un
cajón por combinación es lo que la regla 7 prohíbe.

## Decisiones técnicas

- **Un solo endpoint con más parámetros** en vez de `/aggregate/grouped`: agrupar es una variante
  de agregar. Dos endpoints serían dos listas blancas y dos sitios donde olvidar una validación.
- **`op=count` en el catálogo**: sin él, colapsar `count-by` exigía un endpoint aparte.
- **Techo de 50 + `truncated`**: un desglose por un campo de alta cardinalidad no se dibuja. Se
  recorta y se dice.
- **Los huecos se rellenan arriba**: el motor no inventa filas y el front no debe adivinar meses.
- **Los componentes emitidos no cambian**: el servicio adapta la forma. El diff de oro se queda en
  el servicio y su spec.

## Riesgos identificados

- **`date_trunc` no es portable**: en Mongo es `$dateToString`. Es el mismo riesgo que la 71 ya
  aceptó (dos adapters, un contrato) y se cubre con el test de integración por motor.
- **Zonas horarias en el bucket**: `date_trunc` agrupa en la zona del servidor y el front pinta en
  la del navegador. Se documenta y se deja: la alternativa (pasar la zona en la query) es una
  decisión de producto que nadie ha pedido.
- **El techo cambia el total**: `value` es el total REAL (sin techo) y la suma de `groups` puede ser
  menor. Es correcto, y por eso `truncated` viaja: si no, la barra «otros» no se podría calcular.
- **Menos peticiones, consultas más caras**: una agrupación con `GROUP BY` sobre una tabla grande sin
  índice puede ser más lenta que 8 conteos indexados. No se mide aquí (no hay datos de volumen);
  queda anotado para la primera demo con datos reales.
