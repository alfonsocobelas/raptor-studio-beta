---
name: golden-diff
author: Alfonso Cobelas <alfonso.cobelas@gmail.com>
description: >
  Use when validating generator output, before any commit that touches EJS templates or
  generator.ts, when the user says "golden", "referencia de oro", "diff de oro", "valida el
  generador", "re-baseline", or when a template change might alter emitted code. CRITICAL:
  this is the project's acceptance gate — a template is correct when the diff is empty,
  not when it "looks right".
---

# Gate de oro — validación por diff contra referencias congeladas

Es el equivalente en este proyecto del gate visual de sap-licences: **la prueba de que el generador es correcto es un diff vacío contra los 4 módulos escritos a mano**, no una impresión.

## El mecanismo

```
para cada entidad de oro (customer, contract, license, project):
  1. su <entidad>.model.ts está escrito y versionado
  2. nx generate @raptor/generators:resource <entidad> → carpeta temporal
  3. diff -ru  <generado>  tools/golden-fixtures/<entidad>/
  4. objetivo: diff VACÍO (o solo cosmético justificado)
```

Si las 4 salen limpias, el generador reproduce el trabajo manual ⇒ una entidad nueva saldrá bien. Si una falla, el diff dice exactamente qué le falta a la plantilla o al modelo.

## Las fixtures (`tools/golden-fixtures/`)

- Son copias **congeladas** de los 4 módulos de oro de `docs/referencia/libs/` (backend + frontend), normalizadas con el prettier del repo.
- **Nunca se editan a mano.** El guard de hooks bloquea escrituras directas.
- Cambian solo por **re-baseline deliberado** (abajo).

## Cuándo se ejecuta el gate

- **Siempre antes de commitear** un cambio en `libs/generators/**` (plantillas o generator.ts) o en `libs/schema/**` que afecte a la salida.
- Vía `/golden-diff` (o el target que lo envuelva cuando exista el Makefile).
- Durante el desarrollo de una plantilla, el diff fallando **es el test RED** del ciclo TDD.

## Cómo leer el resultado

- **Diff vacío** → plantilla correcta y generalizable. Commitear.
- **Diff con contenido esperado** (estás implementando justo eso) → sigue iterando hasta vaciarlo.
- **Diff en ficheros que NO tocabas** → regresión: tu cambio alteró salida ajena. PARA y arregla antes de seguir.
- **Diff solo cosmético** (whitespace, orden de imports) → no lo ignores: ajusta `formatFiles`/plantilla hasta eliminarlo. Un diff "solo cosmético" tolerado hoy esconde regresiones mañana.

## Re-baseline (cambiar las fixtures a propósito)

Solo cuando se decide que el **canon emitido cambia** (ej.: se mejora un patrón para todos los módulos):

1. Justificar el cambio (qué patrón cambia y por qué) y obtener OK de Alfonso.
2. Regenerar las 4 entidades y revisar el diff completo **a mano** — el diff es la revisión.
3. Copiar el nuevo generado a `tools/golden-fixtures/` (único momento en que se escriben).
4. Commit propio: `chore(golden): re-baseline <motivo>` — nunca mezclado con otros cambios.

## Reporte estándar

```
🏅 Golden diff — {fecha}
customer:  ✅ vacío | contract: ✅ vacío | license: ❌ 3 ficheros | project: ✅ vacío
Detalle license: {ficheros y primeras líneas del diff}
Veredicto: NO commitear hasta vaciar license.
```
