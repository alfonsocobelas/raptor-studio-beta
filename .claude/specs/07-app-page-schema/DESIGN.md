# Diseño técnico: app-page-schema

## Vocabulario (libs/schema)

`app-types.ts` — TypeScript puro, mismo estilo que `resource-types.ts`:

```ts
export interface KpiTotalWidget {
  kind: 'kpi-total'
  /** Recurso cuyo total muestra la tarjeta (debe estar en el registro de modelos) */
  resource: string
}
export type PageWidget = KpiTotalWidget

export interface DashboardPage {
  kind: 'dashboard'
  /** Label del menú; por defecto 'Dashboard' */
  label?: string
  widgets: PageWidget[]
}

export interface ResourcePage {
  kind: 'resource'
  resource: string
  /** Label del menú; por defecto labels.plural del modelo */
  label?: string
}

export type PageDefinition = DashboardPage | ResourcePage

export interface AppDefinition {
  schemaVersion: 1
  name: string
  /** El orden de páginas gobierna nav, rutas y ruta por defecto (la primera) */
  pages: PageDefinition[]
}
```

`define-app.ts` — `defineApp(definition)`: agrega problemas y lanza `SchemaValidationError`
(se reutiliza; su primer argumento pasa a llamarse conceptualmente "schema name"), congela el
objeto. Reglas v1:

- `schemaVersion` = 1; `name` kebab-case.
- `pages` no vacío; como máximo una página `dashboard` (su ruta emitida es fija: `dashboard`).
- Cada `dashboard` con `widgets` no vacío y sin recursos repetidos entre widgets.
- Sin dos páginas `resource` del mismo recurso.
- `resource` de páginas y widgets: kebab-case no vacío (la existencia en el registro la
  comprueba el generador, que es quien conoce los modelos).

## Registro y selección (plugin)

`libs/generators/src/generators/app/apps/registry.ts` — mismo patrón estático que `MODELS`:

```ts
export const APPS: Record<string, AppDefinition> = { demo }
export function selectApp(name: string): AppDefinition  // lanza con lista de disponibles
```

App registrada inicial: `demo` (dashboard con un KPI por recurso canónico + una página por
recurso en orden de registro) — es exactamente la composición que hoy producen las opciones
planas, y sirve de fixture para el gate de equivalencia.

## Consumo en el generador de app

Nuevo helper puro en `app/composition.ts` (lógica fuera de plantillas, testeable sin Tree):

```ts
export interface AppComposition {
  models: ResourceDefinition[]      // unión ordenada: páginas resource + recursos de widgets
  pages: PageDefinition[]           // normalizadas (labels resueltos)
  dashboard: boolean
  kpiModels: ResourceDefinition[]   // modelos con tarjeta en el dashboard
}
export function composeApp(definition: AppDefinition, registry: Record<string, ResourceDefinition>): AppComposition
export function composeFlat(models: ResourceDefinition[], dashboard: boolean): AppComposition
```

- `composeApp` valida referencias contra el registro (error con lista de disponibles).
- `appGenerator`:
  - `--app` presente + (`models` o `dashboard`) presentes → error de conflicto.
  - `--app` → `composeApp(selectApp(app), MODELS)`; si no → `composeFlat(selectModels(models), dashboard)`.
  - nav/rutas/defaultRoute/dashboardSubstitutions se derivan SOLO de `AppComposition`
    (un único camino de render; las opciones planas se convierten en composición).
- Plantillas: **sin cambios**. `schema.json`: nueva propiedad `app` (string, opcional).

```
opciones planas ──composeFlat──┐
                               ├──> AppComposition ──> navItems / routeEntries /
--app=demo ──selectApp────────┘                        defaultRoute / dashboard
              composeApp
```

## Decisiones técnicas

- **El orden de páginas es la fuente del orden de nav/rutas** (hoy: orden del registro). Con
  opciones planas el comportamiento no cambia.
- **`SchemaValidationError` se reutiliza** para apps: mismo formato agregado de problemas; no se
  crea una jerarquía nueva por un solo caso (YAGNI).
- **Registro estático** de apps (bundle-safe), igual que modelos. La carga desde workspace llegará
  con el editor si hace falta.
- **Widgets pueden referenciar recursos sin página** (KPI de un recurso sin pantalla): el recurso
  entra en `models` (necesita backend) pero no en nav/rutas.

## Riesgos identificados

- Regresión en apps emitidas por el refactor a `AppComposition` → mitigación: gate de equivalencia
  (mismo árbol con planas vs app-schema equivalente) + golden-diff antes de cada commit.
- Tentación de crecer el vocabulario "para el lienzo" → regla explícita en REQUIREMENTS (fuera de
  scope) y regla 7 de la constitución.
