# Tareas atómicas: agregación agrupada

> Un kind se cablea entero. La lección de las specs 70 y 71 ya está pagada dos veces.

## Contrato

- [x] TASK-01: `op=count` entra en el catálogo de operaciones (schema + emitido) y `field` pasa a
      ser opcional para él.
- [x] TASK-02: `groupableFields` emitido por recurso (enums y referencias filtrables).

## Backend emitido

- [x] TASK-03: `aggregateGrouped` en el puerto + `GroupedSpec`/`AggregateGroups`, y la respuesta
      gana `groups` y `truncated`.
- [x] TASK-04: adapter TypeORM (`GROUP BY`, `date_trunc` para el bucket, techo 51).
- [x] TASK-05: adapter Mongoose (`$group`, `$dateToString`, mismo techo).
- [x] TASK-06: caso de uso: valida `groupBy`/`bucketField`, prohíbe los dos ejes, rellena los meses
      vacíos y traduce el techo a `truncated`.
- [x] TASK-07: DTO de query con los parámetros nuevos.
- [x] TASK-08: tests emitidos: integración por motor (enum, mes con huecos, techo) y caso de uso
      (campo no agrupable, dos ejes, count sin campo).

## El ahorro

- [x] TASK-09: `count-by` emitido con UNA petición.
- [x] TASK-10: `series` emitido con UNA petición.
- [x] TASK-11: el gasto del panel de oro cae de 27 a 13, congelado en el spec emitido.

## Kinds nuevos

- [x] TASK-12: `measure` + `field` en `count-by` y `series` (= `sum-by` y `series-sum`), con
      validación y composición.
- [x] TASK-13: `sparkline` en el bloque `kpi`.
- [x] TASK-14: estudio: selector de Medida en los paneles de barras y de serie; sparkline en el
      panel del KPI; previews del lienzo.

## Validación

- [x] TASK-15: golden limpio + `typecheck-emitted.sh` 0 errores + suites + build AOT del estudio.

---

## Cómo se ejecutó (2026-08-27)

Cerrada en 4 commits. Dos números corregidos y dos defectos destapados:

**El ahorro real es 27 → 13, y luego 16.** Prometí 9 contando mal: cada tarjeta KPI es al menos
una petición por sí misma, y el panel de oro tiene ocho entre sus seis tarjetas. Lo que esta spec
ahorra son las 3 del desglose y las 11 de la serie. Después subió a 16 porque el oro estrenó dos
bloques con medida y un sparkline, que son tres peticiones más.

**Las barras y la serie NO existían en el estudio.** TASK-14 se planteó como «añadir un selector de
medida» y en realidad había que subir los dos bloques al lienzo desde cero (paleta, preview, panel,
frontera, generabilidad). Era el hueco que la spec 70 dejó anotado a propósito para cuando el coste
estuviera arreglado.

### Defectos que la ejecución destapó

- **La huella de deduplicado de `count-by`/`series` ignoraba la medida**: un conteo y una suma del
  mismo eje colisionaban. Es exactamente el mismo defecto que la 70 arregló para la tarjeta, en
  otro kind. Lo cazó el oro al no poder generar.
- **El contador del gasto no contaba el sparkline**: el spec emitido habría esperado 15 con 16
  peticiones reales. No lo cazó ninguna suite —el spec emitido no se ejecuta aquí—, sino leer el
  fichero generado.

### Sin verificar

Los tests de integración emitidos del agrupado (`GROUP BY`, `date_trunc`, `$dateToString`, techo)
**existen pero no se han ejecutado**: esta sesión no tiene Docker. Es la deuda de verificación más
grande que dejan las specs 71 y 72 juntas, y la primera demo con datos reales es quien la paga.

### Anotado para la primera demo con datos

Menos peticiones no es automáticamente más rápido: un `GROUP BY` sobre una tabla grande sin índice
puede tardar más que N conteos indexados. No hay datos de volumen para medirlo aquí.
