# Diseño técnico: El panel es una secuencia de bloques

> Requisitos y decisiones en REQUIREMENTS.md (brainstorming 2026-08-19). Enfoque elegido de tres:
> secuencia tipada dentro de la página del panel, con ruptura seca de `widgets`/`tables`.

---

## 0. Antes y después

```
  HOY                                        DESPUÉS
  page = { widgets:[…], tables:[…] }         page = { blocks:[…] }
  orden: clavado en la plantilla             orden: el del dibujo
    1) rejilla de KPIs                       ancho:  el del bloque
    2) secciones analíticas
    3) listados                              cada capacidad nueva = un kind más,
    4) hueco @ai                             nunca un cajón más
  ancho: ignorado (el lienzo lo pinta)
```

## 1. Contrato (`libs/schema/src/lib/app-types.ts`)

```ts
export type BlockWidth = 'full' | 'half'

export type DashboardBlock =
  | { kind: 'metrics';   resources: string[];                                             width?: BlockWidth }
  | { kind: 'count-by';  resource: string; field: string; label?: string;                 width?: BlockWidth }
  | { kind: 'kpi-count'; resource: string; field: string; equals: string; label: string;  width?: BlockWidth }
  | { kind: 'series';    resource: string; field: string; label?: string;                 width?: BlockWidth }
  | { kind: 'table';     resource: string;                                                width?: BlockWidth }

export interface DashboardPage {
  kind: 'dashboard'
  label?: string
  blocks: DashboardBlock[]
}
```

`PageWidget` y sus cuatro interfaces se retiran; `kpi-total` se disuelve en `metrics`. `tables`
(spec 52) desaparece. La validación de `defineApp` (`validateDashboard`) pasa de recorrer widgets a
recorrer bloques, conservando literalmente sus reglas: la clave de duplicado sigue siendo
`kind:recurso:campo` y la existencia del recurso sigue fuera (la frontera es quien conoce el diseño).

## 2. Composición (`libs/generators/src/generators/app/composition.ts`)

```ts
export interface ComposedDashboardBlock {
  kind: 'metrics' | 'count-by' | 'kpi-count' | 'series' | 'table'
  width: BlockWidth                              // resuelto: 'full' si no se declara
  models: ResourceDefinition[]                   // 'metrics' lleva N; el resto, uno
  field?: string
  equals?: string
  label?: string
  values?: { value: string; label: string }[]    // count-by resuelto contra el modelo (spec 32)
  property: string                               // señal del servicio, derivada como hoy
}
```

`AppComposition` sustituye `kpiModels` + `analytics` + `dashboardTables` por
`dashboardBlocks: ComposedDashboardBlock[]`; `dashboard: boolean` se queda. Las validaciones
semánticas de la spec 32 se mueven al bucle de bloques sin cambiar de significado, y las tablas se
resuelven con el mismo `resolve()` que rechaza un recurso que no viaja. `composeFlat` emite un panel
de un bloque: `[{ kind: 'metrics', resources: <todos los modelos> }]`.

## 3. Frontera del estudio (`design-to-app.ts`)

Traduce la vista del lienzo en orden: `kpis → metrics` (sus `resources` tal cual), `table → table`,
cada uno con su `width`. Lo que un panel no admite no cruza. Se conservan las dos reglas de la spec
52: la tabla que viaja dentro del panel no emite además su pantalla, y la misma tabla en otra vista
sí la emite con su título.

Nota de alcance: los bloques analíticos no son declarables desde el lienzo (su `BlockKind` no existe
ahí); llegan solo de app-schemas escritos a mano. Esta spec no lo cambia.

## 4. Emisión (`app.ts` + `files-dashboard/…/dashboard.component.ts.template`)

La plantilla deja de recibir `kpiCards` / `analyticSections` / `listSections` y recibe **una sola
cadena `panelSections`** ya montada, más `listImports` y `listSelectors`. Regla 8: el orden, la
rejilla y el agrupado de anchos se calculan en `generator.ts`.

Agrupado (`groupByWidth`): los `half` **consecutivos** se envuelven en
`<div class="grid gap-4 lg:grid-cols-2">` — **la misma rejilla con la que hoy se emiten los
analíticos**; un bloque `full` cierra el grupo abierto. Un grupo que queda con UN solo `half` —al
final o entre dos `full`— se emite como `full`: nunca media pantalla vacía.

**Corrección medida sobre el diseño inicial**: el ancho por defecto es **por kind**, no `'full'` para
todos. Los tres analíticos ya se emitían a dos columnas, así que su defecto es `half`; `metrics` y
`table` son `full`. Sin esto el refactor movería el panel de la app de oro y el gate no podría
distinguir «refactor fiel» de «cambio de maquetación». Cada bloque, dentro o fuera de fila, emite exactamente el markup de
hoy:

- `metrics` → la rejilla `grid gap-4 sm:grid-cols-2 xl:grid-cols-N` con `N = min(max(n,2),4)`
- `count-by` / `kpi-count` / `series` → su sección actual, sin tocar
- `table` → `<app-<plural>-list [embedded]="true" />`

El servicio (`dashboard.service.ts.template`) conserva su forma: un `_total` por recurso con métrica
—deduplicado, en orden de primera aparición— y los helpers de los kinds presentes. `loadingExpr` y
`errorExpr` se derivan de las mismas propiedades.

## 5. Migración

Los cuatro app-schemas del repo pasan a `blocks`: `golden`, `boutique`, `demo`, `solaris`. Los
diseños del estudio (`.studio/designs/*.json`) NO se tocan: son diseños de lienzo y la frontera los
traduce al generar.

## 6. Verificación

| Gate | Qué prueba |
| --- | --- |
| `nx test schema` | la validación de forma del panel, regla por regla |
| `nx test generators` | composición (orden, ancho por defecto, spec 32 conservada) y `groupByWidth` (rejilla, pares, `half` suelto) |
| suite del estudio | la frontera: bloques en orden, ancho, y las dos reglas de la spec 52 |
| **`npm run golden:diff`** | **vacío, incluido el `dashboard.component.ts` de la app de oro**: no usa `half`, así que un byte movido es un fallo del refactor |
| `web:build` + suite de la app emitida | que el panel compila en AOT y la app sigue verde |

El criterio de aceptación del refactor es el gate de oro vacío, no la inspección visual.

## 7. Riesgos

- **El `studio-api` corre con `ts-node` y no recarga**: tras tocar frontera o generadores hay que
  reiniciarlo antes de generar desde el estudio, o se emite con el código viejo (cazado en la spec 52).
- La suite del estudio da timeouts a 5 s con la máquina cargada; no confundir contención con
  regresión (comparar aislando, como se hizo en la 52).
