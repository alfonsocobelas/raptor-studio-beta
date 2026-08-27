# Tareas atómicas: Bloque KPI configurable

> Cada tarea = un commit. Implementar UNA, hacer commit, esperar revisión.
> Orden TDD obligatorio: test rojo → verde → refactor. En plantillas, el test es el diff de oro.

## Preparación (aislar el ruido del oro)

- [ ] TASK-01: `localDay()` en el emitido y `_series` deja de usar `toISOString`; re-baseline del
      oro a solas (arregla el desfase de zona horaria en los bordes de mes). Su propio diff,
      sin nada de KPI mezclado.

## Vocabulario (libs/schema)

- [ ] TASK-02: Tipos `KpiBlock`, `TopNBlock`, `KpiCondition`, `KpiWindow` + `normalizeDashboardBlocks()`
      que traduce `kpi-count` → `kpi` (tests: alias normalizado, bloque nuevo intacto).
- [ ] TASK-03: Validación en `define-app`: reglas de `kpi` (label, condición completa, ventana,
      `days` 1..3650, `ratio` ⊻ `target`, `compare` exige ventana) y de `top-n` (`n` 1..20).
- [ ] TASK-04: Ampliar la huella de deduplicado de `kind:resource:field` a la config completa
      (test de los dos sentidos: dos KPIs del mismo campo con valores distintos pasan; dos
      bloques idénticos no).
- [ ] TASK-05: `operatorsFor(field)` y `valueControlFor(field)` — fuente única para el panel del
      estudio y para la composición (tests por tipo: enum, booleano, numérico, fecha, texto).

## Composición (libs/generators)

- [ ] TASK-06: `composeApp` resuelve el bloque `kpi` al descriptor `kpi{...}` con sus validaciones
      (campo existe, filterable, operador legal para el tipo, ventana es fecha).
- [ ] TASK-07: `composeApp` resuelve `top-n` (`sortable`, `labelField` por defecto, cabeceras).

## Emitido — funciones puras (plantilla + su spec emitido)

- [ ] TASK-08: `kpi-window.ts`: `windowRange` / `previousRange` para los 6 presets, con los casos
      borde (fin de mes, cambio de año, `days`).
- [ ] TASK-09: `kpi-math.ts`: `deltaOf` (previo 0 → sin porcentaje), `percentOf` (total 0 → 0),
      `progressOf` (saturado a 100).

## Emitido — servicio y tarjeta

- [ ] TASK-10: `kpi-card` gana `delta`, `percent` y `progress` opcionales; la fila de `metrics`
      no cambia de aspecto (diff de oro limpio en las apps sin KPI nuevo).
- [ ] TASK-11: `_kpi` / `_loadKpi` en `dashboard.service`, sustituyendo a `_countWhere`; spec
      emitido que fija los params exactos **y el número de peticiones** por combinación
      (1 / 1 / 2 / 2 / 3).
- [ ] TASK-12: `renderBlock` emite la tarjeta `kpi` (etiqueta, valor, delta, barra) con todo el
      cálculo en `generator.ts`.
- [ ] TASK-13: `_top` + render de `top-n` (lista corta, una petición).

## Estudio

- [ ] TASK-14: `design-page`: kinds `kpi` y `top-n`, campos planos del bloque, `GENERABLE_BLOCKS`,
      entrada de paleta con icono.
- [ ] TASK-15: `canvas-kpi.component` + números de mockup en `mock-data`, fiel a la tarjeta emitida.
- [ ] TASK-16: `kpi-config.component` (Etiqueta / Condición / Ventana / Comparar / Objetivo) con
      operadores y control de valor por tipo de campo. **Si pasa de ~150 líneas, partir en
      Condición y Ventana+modificadores.**
- [ ] TASK-17: `canvas-top-n.component` + `top-n-config.component`.
- [ ] TASK-18: Generabilidad por datos: sin campo filtrable / sin campo ordenable → «Diseño aún
      no generable», sin cruzar la frontera.
- [ ] TASK-19: Frontera `design-to-app`: `isPanelBlock` sustituye al disparador `kpis`, traduce
      `kpi` y `top-n`, y avisa cuando una segunda vista trae bloques de panel.

## Validación

- [ ] TASK-20: Golden: un modelo de oro estrena `kpi` con condición + ventana + comparación y
      otro estrena `top-n`; `/golden-diff` limpio en el resto.
- [ ] TASK-21: `npm run typecheck` + suites del estudio y del plugin en verde; typecheck del
      emitido a 0 errores.

---

## Regla del juego

Implementar **UNA** tarea, commit, esperar aprobación antes de seguir.
