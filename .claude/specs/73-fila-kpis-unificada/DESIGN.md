# Spec 73 — Diseño: fila de KPIs unificada

## Idea central

La familia analítica deja de ser 5 bloques y pasa a ser **1 bloque contenedor + 5 tipos de celda**:
`counter`, `kpi`, `top-n`, `count-by`, `series`. El contador es celda propia (no un `kpi` pelado):
un `kpi` exige `label` —que la normalización no puede inventar porque no conoce los modelos— y el
contador de hoy (`metrics`) ya tiene emisión probada con subtítulo y spec de totales; se conserva
tal cual, solo cambia dónde vive (dentro de la fila).

```
Paleta                    Lienzo                          App emitida
┌──────────┐   drop   ┌──────────────────────────────┐   ┌──────────────────────────────┐
│ ▦ KPIs   │ ───────► │ ┌──────┬────────┬──────┬───┐ │   │ grid: 1 col tarjeta, 2 gráfica│
└──────────┘          │ │ 127  │ Top 5  │ ▂▅▇▃ │ + │ │   │ [kpi] [top-n]  [██ count-by ]│
                      │ │pedid.│importe │barras│   │ │   └──────────────────────────────┘
                      │ └──────┴────────┴──────┴───┘ │
                      └──────────────────────────────┘
```

## 1. Modelo de diseño (`apps/studio/libs/shared/domain/src/studio/design-page.ts`)

- `BlockKind` pierde `kpi`, `top-n`, `count-by`, `series`. `kpis` se queda y pasa a ser la fila.
- Celda nueva, con los MISMOS campos planos que hoy tiene el bloque suelto (el autosave y la
  lectura del JSON no cambian de naturaleza; solo se anida la lista):

```ts
export type KpiCellKind = 'counter' | 'kpi' | 'top-n' | 'count-by' | 'series'
export interface KpiCell {
  kind: KpiCellKind
  resource: string
  // …los campos kpi*/top*/axis/measure actuales de DesignBlock, sin cambios
  // counter no usa ninguno: es el total del recurso con su tarjeta de hoy
}
```

- `DesignBlock` gana `items?: KpiCell[]` (solo `kpis` lo usa); `resources?` queda como formato
  viejo que la normalización traduce (no se escribe más).
- Los campos `kpi*`, `top*`, `axisField`, `measure*` se van de `DesignBlock` a `KpiCell` — quien
  los tenía era la familia analítica y ya no existe suelta.

## 2. Migración: `normalizeDesignPages()` (misma lib, junto al modelo)

Función pura, un solo punto de verdad, llamada en TODAS las entradas de páginas al store
(carga inicial desde la API y `applyExternalDesign`; el gate `mutate` no la necesita porque el
estudio ya solo produce el formato nuevo):

- `{ kind: 'kpi' | 'top-n' | 'count-by' | 'series', ... }` → `{ kind: 'kpis', items: [celda] }`
  copiando campo a campo.
- `{ kind: 'kpis', resources: [a, b] }` → `items: [{ kind: 'kpi', resource: a }, { … b }]`.
- Formato nuevo → pasa tal cual. Idempotente.

El backend del estudio (design-files) no migra: guarda lo que el front le manda; la conversión
ocurre al leer.

## 3. Estudio

- **Paleta** (`views-sidebar.component.ts`): quedan `kpis` («KPIs») y desaparecen las otras 4
  entradas. `block-drop.ts` crea `{ kind: 'kpis', items: [], width: 'full' }`.
- **Lienzo**: `canvas-kpi-row.component.ts` (evolución del caso `kpis` de `canvas-page`): pinta
  las celdas en un grid (`grid-column: span 1|2` según tipo) reutilizando los renders existentes
  (`canvas-kpi`, `canvas-top-n`, `canvas-chart`) adaptados a recibir una celda, y al final el
  cuadrado «+» con un menú de 5 opciones (Contador, KPI, Top N, Barras, Evolución), una por tipo
  de celda. El menú propone el recurso de la vista si existe.
- **Config**: el store gana selección de celda (`selectCell(blockIndex, cellIndex)`); los paneles
  `kpi-config`, `top-n-config` y `chart-config` se retargetan a la celda seleccionada (mismos
  controles, distinto destino del patch). Quitar celda desde el propio panel o desde la celda.
- **Generabilidad** (`generableHere` + marcas del lienzo): una celda incompleta (top-n sin
  `topField`, gráfica sin `axisField`, kpi con medida sin campo) se marca en el lienzo y la
  frontera la omite; una fila sin celdas emitibles no se emite (regla ya existente para `kpis`
  sin `resources`).

## 4. App-schema (`libs/schema/src/lib/app-types.ts` + `normalize-dashboard.ts`)

- Kind nuevo:

```ts
| { kind: 'kpi-row'; cells: KpiRowCell[]; width?: BlockWidth }
// KpiRowCell = { kind: 'counter'; resource } | las variantes kpi | top-n | count-by | series, sin `width`
```

- Los kinds sueltos `metrics`, `kpi`, `top-n`, `count-by`, `series` pasan a deprecated de LECTURA
  (mismo trato que `kpi-count`): `normalizeDashboardBlocks` los envuelve en `kpi-row` de una celda
  (`metrics` → una celda `counter` por recurso). `table` no cambia.
- `defineApp` valida las celdas con las mismas reglas que hoy validan los bloques.

## 5. Frontera (`design-to-app.ts`)

`panelBlocks()` deja de traducir 5 kinds y traduce uno: `kpis.items` → `{ kind: 'kpi-row', cells }`
reutilizando `kpiBlockOf` y los mapeos actuales por celda. La detección de «esta vista es un
panel» no cambia (cualquier celda cuenta como analítica).

## 6. Generador (`app.ts` + plantilla del dashboard)

- `composition.ts`/`dashboardSubstitutions()` reciben `kpi-row` ya normalizado. Lógica en app.ts
  (plantillas tontas): por cada fila calcula las columnas (suma de spans; tarjeta=1, gráfica=2) y
  renderiza las celdas con los MISMOS fragmentos que hoy emiten los bloques sueltos.
- HTML emitido: un `<div class="grid gap-4 ...">` por fila con `col-span` por celda; en pantallas
  estrechas colapsa a una columna (patrón ya presente en el dashboard de oro).
- El conteo de peticiones del panel no cambia (spec 72): mismas celdas, mismas llamadas.
- Golden: re-baseline del dashboard de las fixtures (el app-schema de oro se reescribe con
  `kpi-row` explícito para que el diff proteja el formato nuevo).

## 7. Riesgos y decisiones

- **Anidar celdas vs autosave**: el autosave parchea bloques; al tocar una celda se parchea el
  bloque `kpis` entero (items incluidos). Aceptado: una fila son pocas celdas, el patch sigue
  siendo pequeño y legible.
- **Smokes y tests existentes** que montan kinds sueltos (`smoke-drag`, specs del store, chat):
  se migran en la misma tarea que rompe el tipo — el compilador es la lista de tareas.
- **El chat/puente de IA** puede proponer kinds viejos: pasa por `applyExternalDesign`, que
  normaliza. Nada que hacer aparte de un test.
- **`.studio/designs/*.json` sucios** (aguas, peritajes…): no se tocan a mano; se convierten al
  cargar y el siguiente autosave los reescribe en formato nuevo.
