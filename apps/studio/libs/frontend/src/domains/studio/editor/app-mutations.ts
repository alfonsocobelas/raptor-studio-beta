import { defineApp, type AppDefinition, type DashboardPage, type ResourceDefinition } from '@acc/schema'

/**
 * Mutaciones puras del app-schema: cada operación devuelve una definición NUEVA
 * validada por defineApp (gate estructural). Si la mutación dejaría el schema
 * inválido, defineApp lanza y el store no la aplica. Nada muta in place.
 */

export function removePage(def: AppDefinition, index: number): AppDefinition {
  return validated({ ...def, pages: def.pages.filter((_, i) => i !== index) })
}

export function removeWidget(def: AppDefinition, pageIndex: number, widgetIndex: number): AppDefinition {
  const page = def.pages[pageIndex]
  if (page?.kind !== 'dashboard') throw new Error(`La página ${pageIndex} no es un dashboard`)

  const widgets = page.widgets.filter((_, i) => i !== widgetIndex)
  if (!widgets.length) return removePage(def, pageIndex)

  return validated({ ...def, pages: def.pages.map((p, i) => (i === pageIndex ? { ...page, widgets } : p)) })
}

export function movePage(def: AppDefinition, from: number, to: number): AppDefinition {
  const pages = [...def.pages]
  const [moved] = pages.splice(from, 1)
  pages.splice(to, 0, moved)
  return validated({ ...def, pages })
}

export function addResourcePage(def: AppDefinition, resource: string): AppDefinition {
  return validated({ ...def, pages: [...def.pages, { kind: 'resource', resource }] })
}

export function addKpiWidget(def: AppDefinition, resource: string): AppDefinition {
  const widget = { kind: 'kpi-total', resource } as const
  const dashboardIndex = def.pages.findIndex(p => p.kind === 'dashboard')
  if (dashboardIndex === -1) {
    return validated({ ...def, pages: [{ kind: 'dashboard', widgets: [widget] }, ...def.pages] })
  }
  const dashboard = def.pages[dashboardIndex] as DashboardPage
  return validated({
    ...def,
    pages: def.pages.map((p, i) => (i === dashboardIndex ? { ...dashboard, widgets: [...dashboard.widgets, widget] } : p))
  })
}

export interface Palette {
  /** Recursos del catálogo sin página propia */
  resourcePages: string[]
  /** Recursos del catálogo sin tarjeta KPI */
  kpiWidgets: string[]
  /** Se puede añadir un dashboard (no existe aún) */
  dashboard: boolean
}

/** Lo añadible se DERIVA del catálogo del generador — la paleta nunca inventa piezas. */
export function paletteOf(def: AppDefinition, registry: Record<string, ResourceDefinition>): Palette {
  const paged = new Set(def.pages.filter(p => p.kind === 'resource').map(p => p.resource))
  const dashboard = def.pages.find((p): p is DashboardPage => p.kind === 'dashboard')
  const withKpi = new Set(dashboard?.widgets.map(w => w.resource) ?? [])
  const all = Object.keys(registry)
  return {
    resourcePages: all.filter(r => !paged.has(r)),
    kpiWidgets: all.filter(r => !withKpi.has(r)),
    dashboard: !dashboard
  }
}

function validated(def: AppDefinition): AppDefinition {
  // defineApp congela: se le pasa una copia profunda de pages para no congelar entradas compartidas
  return defineApp(JSON.parse(JSON.stringify(def)) as AppDefinition)
}
