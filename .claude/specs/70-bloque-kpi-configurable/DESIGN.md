# Diseño técnico: Bloque KPI configurable

## Capa backend

**Ninguna.** Cero endpoints, cero use cases, cero dominio, cero migraciones. Todo el dato sale
del listado que ya existe (`GET {api}?page=1&pageSize=1&filters=[…]` → `total`) y, para `top-n`,
de una página ordenada (`pageSize=N&sortField=…&sortDir=desc`). Si un KPI no se puede contar con
los operadores actuales de `FilterOperator`, no entra aquí: entra en la spec 71.

## Vocabulario: app-schema (`libs/schema/src/lib/app-types.ts`)

Un solo kind `kpi` con medida y modificadores, más `top-n`:

```ts
export type KpiMeasure = 'count'                       // la 71 añade sum | avg | min | max | distinct
export type KpiOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
                        | 'contains' | 'starts_with' | 'ends_with'
export type KpiWindowPreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'days'

export interface KpiCondition { field: string; operator: KpiOperator; value: string }
export interface KpiWindow { field: string; preset: KpiWindowPreset; days?: number }

| { kind: 'kpi'
    resource: string
    label: string
    measure?: KpiMeasure          // 'count' por defecto
    condition?: KpiCondition
    window?: KpiWindow
    ratio?: boolean              // el valor sobre el total del recurso en la misma ventana
    compare?: boolean            // variación contra la ventana anterior
    target?: number              // barra de progreso
    width?: BlockWidth }

| { kind: 'top-n'
    resource: string
    field: string                // campo de orden (sortable)
    n: number
    labelField?: string          // por defecto list.deleteLabelField ?? 'name'
    dir?: 'asc' | 'desc'         // 'desc' por defecto
    label?: string
    width?: BlockWidth }
```

`kpi-count` **no se borra del tipo**: se marca `@deprecated` y `normalizeDashboardBlocks()`
(nueva, en `libs/schema`) lo traduce a `{ kind: 'kpi', condition: { field, operator: 'eq', value: equals } }`
antes de validar y antes de componer. Así los `*.app.ts` de oro, `solaris.app.ts` y los diseños
ya guardados en `.studio/designs/` siguen funcionando sin editarlos.

### Validación (`define-app.ts`)

- `kpi`: `label` no vacío; `condition` completa si está (campo + operador + valor no vacío);
  `window.field` obligatorio si hay ventana; `window.days` obligatorio y 1..3650 solo con
  `preset: 'days'`; `compare` exige `window` (no hay «periodo anterior» de «siempre»);
  `ratio` y `target` mutuamente excluyentes; `target > 0`.
- `top-n`: `field` no vacío, `n` entero 1..20.
- **Clave de deduplicado**: pasa de `kind:resource:field` a la huella COMPLETA del bloque
  (`kind:resource:condition:window:ratio:compare:target`). Sin esto, dos KPIs sobre el mismo
  campo con valores distintos —el caso más normal del mundo— se rechazan como duplicados.
  Es un defecto vivo que esta spec arregla porque la bloquea.

### Composición (`composition.ts`)

`ComposedDashboardBlock` gana `'kpi' | 'top-n'` en `kind` y estos campos ya masticados
(regla 8 — la plantilla solo interpola):

```ts
  /** kpi/top-n: descriptor serializado que el servicio emitido recibe tal cual */
  kpi?: { filters: KpiCondition[]; window?: KpiWindow; ratio: boolean; compare: boolean; target?: number }
  top?: { field: string; n: number; dir: 'asc' | 'desc'; labelField: string; labelHeader: string; fieldHeader: string }
```

Validaciones al componer (el error llega al DISEÑAR, no al compilar — criterio de la spec 32):
`condition.field` existe y es `query.filterable`; el operador es legal para el tipo del campo;
`window.field` existe, es `date`/`timestamptz` y es filterable; `top.field` existe y es
`query.sortable`. Las etiquetas de columna de `top-n` salen de `field.table.label ?? form.label`.

La ventana **no se resuelve al generar**: `este mes` depende de cuándo se abre el panel. El
descriptor viaja al emitido y el rango se calcula en el navegador.

## Capa frontend emitida

### Dos ficheros nuevos, puros y con test propio

`libs/frontend/src/core/services/kpi-window.ts`

```ts
export interface Range { start: string; end: string }              // 'YYYY-MM-DD', semiabierto
export function windowRange(preset, days, now: Date): Range
export function previousRange(preset, days, now: Date): Range      // misma longitud, justo antes
export function localDay(date: Date): string                       // sin toISOString
```

`localDay` se construye con `getFullYear/getMonth/getDate` y `padStart`. **Arregla el desfase
de zona horaria del `_day()` actual**: `new Date(2026, 7, 1).toISOString().slice(0, 10)` en
Madrid devuelve `2026-07-31`, así que la serie de la spec 32 lleva contando mal los bordes de
mes. `_series` pasa a usar `localDay` y el diff de oro lo reflejará.

`libs/frontend/src/core/services/kpi-math.ts`

```ts
export function deltaOf(value: number, previous: number): { direction: 'up'|'down'|'flat'; percent?: number; absolute: number }
export function percentOf(value: number, total: number): number    // 0 si total === 0
export function progressOf(value: number, target: number): number  // saturado a 100
```

`deltaOf` con `previous === 0` devuelve `percent: undefined` y solo el absoluto: nada de `+∞%`.

### Servicio del panel (`dashboard.service.ts.template`)

Un helper único sustituye a `_countWhere`:

```ts
  private _kpi(api: string, spec: KpiSpec) {
    return resource<KpiValue, unknown>({ loader: () => this._loadKpi(api, spec) })
  }
```

y `_loadKpi` dispara **exactamente** las peticiones que el descriptor pide:

```
condición sola ................. 1   (value)
+ ventana ...................... 1   (value acotado al rango)
+ compare ...................... 2   (value + previous)
+ ratio ........................ 2   (value + total en la misma ventana)
+ ratio + compare .............. 3   (value + previous + total)
top-n .......................... 1
```

`compare` compara el valor, no el ratio: el porcentaje del periodo anterior es otro KPI y
mezclarlos daría una flecha que nadie sabe leer.

### Tarjeta

`kpi-card.ts` gana tres inputs **opcionales** (`delta`, `percent`, `progress`) y sigue siendo
presentacional. No se crea un componente nuevo: la fila de `metrics` usa el mismo y así una
tarjeta de total y una de KPI condicionado son visualmente hermanas, que es lo que el panel
necesita.

```
┌─────────────────────────┐   ┌─────────────────────────┐
│ Pendiente de cobro      │   │ Instalaciones cerradas  │
│ 37        ▲ 12,1%       │   │ 42 de 60                │
│ vs. mes anterior        │   │ ███████████░░░░░  70%   │
└─────────────────────────┘   └─────────────────────────┘
```

`top-n` se emite como una tarjeta con lista corta (etiqueta + valor alineado a la derecha),
no como `<table>`: son 5 filas sin paginar ni ordenar.

## Capa estudio

### Modelo del lienzo (`design-page.ts`)

`BlockKind += 'kpi' | 'top-n'`; ambos a `GENERABLE_BLOCKS`. `DesignBlock` gana campos **planos**
(igual que hizo el calendario con `dateField`/`labelField`, no objetos anidados: el autosave
parchea campo a campo y el diseño guardado se lee de un vistazo):

```
kpiConditionField, kpiConditionOperator, kpiConditionValue,
kpiWindowField, kpiWindowPreset, kpiWindowDays,
kpiRatio, kpiCompare, kpiTarget,
topField, topN, topLabelField, topDir
```

La frontera los ensambla en los objetos anidados del app-schema.

### Componentes nuevos

- `canvas-kpi.component.ts` / `canvas-top-n.component.ts`: preview con números de mockup
  (`mock-data.ts`), fieles a la tarjeta emitida arriba.
- `kpi-config.component.ts` / `top-n-config.component.ts`: patrón `calendar-config` literal,
  montados en `design-panel.component.ts`.
- `kpi-operators.ts` (dominio compartido del estudio): `operatorsFor(field): {value,label}[]` y
  `valueControlFor(field): 'select'|'number'|'date'|'text'`. **Una sola fuente** para el panel
  y para la validación de la composición; duplicarla es garantizar que divergen.

Generabilidad por datos (patrón calendario/kanban): sin campo filtrable → «Diseño aún no
generable»; `top-n` sin campo ordenable, ídem.

### Frontera (`design-to-app.ts`)

El disparador del panel deja de ser el bloque `kpis`:

```
antes:  const kpis = page.blocks.some(b => b.kind === 'kpis' && b.resources?.length)
        const blocks = kpis && !hasDashboard ? panelBlocks(page) : []

ahora:  const panel = page.blocks.some(isPanelBlock)     // kpis | kpi | top-n
        const blocks = panel && !hasDashboard ? panelBlocks(page) : []
```

`panelBlocks` traduce además `kpi` y `top-n`. `titleTaken` pasa a depender de `panel`.

## Decisiones técnicas

- **Un kind con modificadores, no cinco kinds**: `ratio`, `compare` y `target` son lecturas del
  mismo conteo. Cinco kinds serían cinco caminos de render para un número (regla 7).
- **`kpi-count` como alias normalizado, no borrado**: hay diseños guardados y dos `*.app.ts` de
  oro que lo usan. Traducir al leer cuesta 10 líneas; migrar ficheros a mano cuesta un diff de
  oro sucio y una demo roja.
- **La ventana se resuelve en el navegador**, no al generar: `este mes` cambia cada mes y el
  código emitido no se regenera cada mes.
- **El ratio es contra el total del recurso**, no contra una segunda condición: dos condiciones
  que el usuario tiene que hacer casar es un KPI mal configurado esperando a ocurrir.
- **Aritmética en funciones puras con test propio** (`kpi-math`, `kpi-window`) en vez de en
  `computed` del componente: es donde están los casos borde (dividir por cero, saturar al 100%,
  bordes de mes) y son los que un componente no testea bien.
- **Campos planos en `DesignBlock`**: consistencia con calendario/kanban y con el autosave.
- **`localDay` en vez de `toISOString`**: arregla el desfase de zona horaria, de paso, en la
  serie existente.

## Riesgos identificados

- **Un solo dashboard por app** (`hasDashboard`): tarjetas KPI dibujadas en una segunda vista se
  descartan en silencio. Mitigación: aviso en el lienzo (`canvas-notice.service`) cuando una
  vista trae bloques de panel y ya hay panel. Arreglar el límite es otra spec.
- **El diff de oro se moverá más de lo previsto** por `localDay` (todo panel con `series`).
  Mitigación: hacer ese cambio en su propia tarea, con su propio diff, antes de tocar KPIs.
- **Peticiones en cascada**: seis tarjetas con ratio+compare son 18 peticiones al abrir el panel.
  Mitigación: el test del spec emitido fija el número exacto por tarjeta, y la 71 (con `groupBy`)
  es la que baja el total de verdad. Documentarlo, no esconderlo.
- **Operadores de texto sobre campos enum**: `contains` sobre un enum es legal en la API y casi
  siempre un error de diseño. Mitigación: `operatorsFor` no lo ofrece en enum.
- **Deuda de la clave de deduplicado**: al ampliar la huella, un diseño que hoy pasa validación
  por colisión podría empezar a admitir bloques idénticos con otro campo. Test explícito de los
  dos sentidos.
