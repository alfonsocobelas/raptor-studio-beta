# Tareas atómicas: Bloque KPI configurable

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Orden TDD obligatorio: test rojo → verde → refactor. En plantillas, el test es el diff de oro.

## Preparación (aislar el ruido del oro)

- [x] TASK-01: `localDay()` en el emitido y `_series` deja de usar `toISOString`; re-baseline del
      oro a solas (arregla el desfase de zona horaria en los bordes de mes). Su propio diff,
      sin nada de KPI mezclado.

## Vocabulario (libs/schema)

- [x] TASK-02: Tipos `KpiBlock`, `TopNBlock`, `KpiCondition`, `KpiWindow` + `normalizeDashboardBlocks()`
      que traduce `kpi-count` → `kpi` (tests: alias normalizado, bloque nuevo intacto).
- [x] TASK-03: Validación en `define-app`: reglas de `kpi` (label, condición completa, ventana,
      `days` 1..3650, `ratio` ⊻ `target`, `compare` exige ventana) y de `top-n` (`n` 1..20).
- [x] TASK-04: Ampliar la huella de deduplicado de `kind:resource:field` a la config completa
      (test de los dos sentidos: dos KPIs del mismo campo con valores distintos pasan; dos
      bloques idénticos no).
- [x] TASK-05: `operatorsFor(field)` y `valueControlFor(field)` — fuente única para el panel del
      estudio y para la composición (tests por tipo: enum, booleano, numérico, fecha, texto).

## Composición (libs/generators)

- [x] TASK-06: `composeApp` resuelve el bloque `kpi` al descriptor `kpi{...}` con sus validaciones
      (campo existe, filterable, operador legal para el tipo, ventana es fecha).
- [x] TASK-07: `composeApp` resuelve `top-n` (`sortable`, `labelField` por defecto, cabeceras).

## Emitido — funciones puras (plantilla + su spec emitido)

- [x] TASK-08: `kpi-window.ts`: `windowRange` / `previousRange` para los 6 presets, con los casos
      borde (fin de mes, cambio de año, `days`).
- [x] TASK-09: `kpi-math.ts`: `deltaOf` (previo 0 → sin porcentaje), `percentOf` (total 0 → 0),
      `progressOf` (saturado a 100).

## Emitido — servicio y tarjeta

- [x] TASK-10: `kpi-card` gana `delta`, `percent` y `progress` opcionales; la fila de `metrics`
      no cambia de aspecto (diff de oro limpio en las apps sin KPI nuevo).
- [x] TASK-11: `_kpi` / `_loadKpi` en `dashboard.service`, sustituyendo a `_countWhere`; spec
      emitido que fija los params exactos **y el número de peticiones** por combinación
      (1 / 1 / 2 / 2 / 3).
- [x] TASK-12: `renderBlock` emite la tarjeta `kpi` (etiqueta, valor, delta, barra) con todo el
      cálculo en `generator.ts`.
- [x] TASK-13: `_top` + render de `top-n` (lista corta, una petición).

## Estudio

- [x] TASK-14: `design-page`: kinds `kpi` y `top-n`, campos planos del bloque, `GENERABLE_BLOCKS`,
      entrada de paleta con icono.
- [x] TASK-15: `canvas-kpi.component` + números de mockup en `mock-data`, fiel a la tarjeta emitida.
- [x] TASK-16: `kpi-config.component` (Etiqueta / Condición / Ventana / Comparar / Objetivo) con
      operadores y control de valor por tipo de campo. **Si pasa de ~150 líneas, partir en
      Condición y Ventana+modificadores.**
- [x] TASK-17: `canvas-top-n.component` + `top-n-config.component`.
- [x] TASK-18: Generabilidad por datos: sin campo filtrable / sin campo ordenable → «Diseño aún
      no generable», sin cruzar la frontera.
- [x] TASK-19: Frontera `design-to-app`: `isPanelBlock` sustituye al disparador `kpis`, traduce
      `kpi` y `top-n`, y avisa cuando una segunda vista trae bloques de panel.

## Validación

- [x] TASK-20: Golden: un modelo de oro estrena `kpi` con condición + ventana + comparación y
      otro estrena `top-n`; `/golden-diff` limpio en el resto.
- [x] TASK-21: `npm run typecheck` + suites del estudio y del plugin en verde; typecheck del
      emitido a 0 errores.

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación antes de seguir.

---

## Cómo se ejecutó de verdad (2026-08-27)

El reparto de arriba se mantuvo salvo en dos puntos, y conviene que quede escrito:

1. **TASK-06/07/08/09/11/12/13 cayeron en UN commit.** El tipo de `ComposedDashboardBlock` no
   admite un kind a medias: en cuanto `kpi` entra en la unión, `app.ts` deja de compilar hasta que
   emite ese kind. Separar composición de emisión dejaba la suite roja entre dos commits, que es
   justo lo que el gate prohíbe. Un kind se cablea entero o no se cablea.
2. **La normalización del alias no entró en `defineApp`.** El DESIGN decía normalizar antes de
   validar; se hace en `composeApp` y en la frontera, pero NO en `defineApp`, para que
   `kpi-count` conserve sus mensajes propios (`equals`, `label`) en vez de uno genérico sobre
   `condition`.

### Tareas que la ejecución destapó y no estaban previstas

- **Fechas, números y booleanos no eran filtrables** en el mapeo del borrador del estudio
  (`draft-resource.ts`): solo lo eran los enums, las referencias y el campo nombre. Sin
  arreglarlo, la ventana temporal del KPI nacía muerta. Commit propio, previo al bloque.
- **`top-n` no puede asumir un campo `name`**: ni contract ni project lo tienen en el canon. El
  campo etiqueta por defecto pasa a ser el que el listado ya usa para nombrar, y en su defecto el
  primer campo buscable.
- **`params` condicional roto en el emitido**: la unión de dos formas de objeto no encaja en
  ninguna sobrecarga de `HttpClient.get`. Lo cazó `typecheck-emitted.sh`, no el oro ni la suite.

### Defecto de tooling detectado (fuera de esta spec)

`tools/typecheck-emitted.sh` **sale con código 0 aunque reporte errores de TypeScript**. Aquí no
importó porque se leyó el log, pero en CI un fallo del emitido pasaría por verde. Merece su propia
tarea.
