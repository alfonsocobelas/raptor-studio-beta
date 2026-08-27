# Spec 72: Agregación agrupada — `groupBy` y `bucket`

## Contexto de negocio

La spec 71 abrió el endpoint de agregación y devuelve UN número. Con eso, el panel ya dice cuánto
se ha facturado, pero sigue sin poder decir **cuánto por estado** ni **cuánto cada mes** sin
preguntarlo N veces. Y eso último no es teoría: hoy `count-by` con 8 valores de enum hace **8
peticiones** y `series` hace **12**, una por punto. El panel de oro gasta 27 peticiones al abrirse.

Esta spec cierra el círculo: el mismo endpoint agrupa, y con ello (a) nacen los bloques que
enseñan un desglose de una MEDIDA, no de un conteo, (b) `count-by` y `series` bajan a **una
petición cada uno**, y (c) la tarjeta KPI puede llevar su sparkline sin pagar 12 llamadas.

## User stories (formato EARS)

- WHEN el front pide `…/aggregate?op=count&groupBy=status` THEN la API responde
  `{ "value": 42, "groups": [{ "key": "pending", "value": 30 }, …] }`: el desglose y su total.
- WHEN pide `…/aggregate?op=sum&field=amount&groupBy=status` THEN cada grupo trae la suma de ese
  estado y `value` la suma de todos.
- WHEN pide `…/aggregate?op=sum&field=amount&bucket=month&bucketField=issuedAt&months=12` THEN la
  respuesta trae **un grupo por mes**, con clave `YYYY-MM`, incluidos los meses sin datos a 0 —
  una serie con huecos no se puede dibujar.
- IF `groupBy` no está en la lista blanca de campos **agrupables** del recurso THEN 400. La lista
  es nueva y NO es la de agregables: se agrupa por enums y por referencias, no por importes.
- IF `bucketField` no es un campo fecha filtrable del recurso THEN 400.
- IF se piden `groupBy` y `bucket` a la vez THEN 400: dos ejes son otra pregunta (y otra spec).
- IF `op` es `count` THEN `field` no se exige: contar filas no mide ninguna columna.
- IF el grupo no tiene registros THEN su valor es 0 en `count`, `sum` y `distinct`, y se OMITE en
  `avg`, `min` y `max` — la media de un grupo vacío no es cero.
- WHEN el número de grupos supera 50 THEN la API responde los 50 mayores y lo dice
  (`"truncated": true`): un desglose por un campo de alta cardinalidad no se dibuja, y devolver
  20.000 grupos sería un incidente, no un panel.
- WHEN el diseño declara `count-by` o `series` THEN la app emitida los resuelve con **una** llamada
  agrupada, no con N conteos.
- WHEN el diseño declara `sum-by` (desglose de una medida por enum) o `series-sum` (evolución
  mensual de una medida) THEN el generador los emite con esa misma llamada.
- WHEN un `kpi` declara `sparkline` THEN la tarjeta lleva su mini-serie de 12 meses, resuelta en
  una petición.

## Criterios de aceptación

- [ ] `groupableFields` emitido por recurso (enums y referencias) y validado en el caso de uso.
- [ ] `groupBy` y `bucket` en el endpoint, con `op=count` admitido y `field` opcional para él.
- [ ] Repositorio: `aggregateGrouped` en el puerto y en **las dos** ranuras de motor, con los
      meses vacíos rellenados y el techo de 50 grupos.
- [ ] Tests de integración por motor: agrupado por enum, por mes con huecos, techo y grupo vacío.
- [ ] Test del caso de uso: campo no agrupable, los dos ejes a la vez, `op=count` sin campo.
- [ ] `count-by` y `series` emitidos con UNA petición cada uno; el gasto del panel de oro baja de
      27 a 13 y queda congelado en el spec emitido.
- [ ] Kinds `sum-by` y `series-sum` en el app-schema, la composición y el estudio.
- [ ] `sparkline` en el bloque `kpi`, con su preview en el lienzo.
- [ ] Golden limpio, `typecheck-emitted.sh` a 0 errores, suites y build AOT del estudio en verde.

## Reglas de negocio aplicables

- **Validar en el borde**: `groupBy` y `bucketField` acaban en la consulta igual que `field`. Lista
  blanca emitida, comprobada en el caso de uso.
- **Un solo endpoint**: agrupar es una variante de agregar, no un endpoint nuevo. Dos endpoints
  serían dos listas blancas y dos formas de decir lo mismo.
- **Techo explícito**: cuando la respuesta se recorta, se dice. Un `truncated` silencioso se lee
  como «esto es todo».
- «Generar, no interpretar»: dos ejes, `HAVING`, ordenaciones a medida → a mano sobre lo emitido.

## Fuera de scope (deliberado)

- Dos ejes de agrupación a la vez (tabla cruzada).
- Buckets distintos del mes (semana, día, trimestre): el mes es el único que los bloques usan hoy.
- Percentiles y medianas: siguen sin ser portables entre motores.
- Cachés: esta spec baja las peticiones de 27 a 9 cambiando la pregunta, no guardando respuestas.
