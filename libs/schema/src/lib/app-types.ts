// Canonical app-schema format (spec 07, phase A of the visual editor vision).
// Declares how an app is composed — pages, order, widgets — with a vocabulary
// limited to what the app generator already emits (rule 7: never ahead of it).
// Pure TypeScript on purpose — this lib knows nothing about frameworks or tooling.

export interface KpiTotalWidget {
  kind: 'kpi-total'
  /** Recurso cuyo total muestra la tarjeta (su existencia la valida el generador) */
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
