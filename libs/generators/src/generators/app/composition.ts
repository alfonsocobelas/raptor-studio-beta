import { DEFAULT_THEME_ID, resolveThemeId } from '@acc/schema'
import type { AppDefinition, PageDefinition, PortsDefinition, ResourceDefinition } from '@acc/schema'

/**
 * Composición normalizada de una app: el único vocabulario del que el generador
 * deriva nav, rutas, ruta por defecto y dashboard. Las opciones planas (models,
 * dashboard) y el app-schema (defineApp) convergen aquí — un solo camino de render.
 */
/** Página normalizada: el label del menú siempre queda resuelto al componer. */
export type ComposedPage = PageDefinition & { label: string }

export interface AppComposition {
  /** Modelos incluidos en la app (backend + servicio), en orden de aparición */
  models: ResourceDefinition[]
  /** Páginas con labels resueltos; su orden gobierna nav y rutas */
  pages: ComposedPage[]
  dashboard: boolean
  /** Modelos con tarjeta KPI en el dashboard, en orden de widget */
  kpiModels: ResourceDefinition[]
  /** Tema declarado por el app-schema (spec 20); siempre resuelto, 'neutral' por defecto */
  themeId: string
  /** Puertos declarados en el app-schema; ausente = los del esqueleto */
  ports?: PortsDefinition
}

/** Composición histórica de las opciones planas: [dashboard?] + una página por modelo. */
export function composeFlat(models: ResourceDefinition[], dashboard: boolean): AppComposition {
  const pages: ComposedPage[] = models.flatMap(model => [
    { kind: 'resource' as const, resource: model.name, label: labelOf(model) },
    // una galería declarada sin vista que la muestre sería inalcanzable
    ...(model.gallery ? [{ kind: 'cards' as const, resource: model.name, label: `${labelOf(model)} · galería` }] : [])
  ])
  if (dashboard) {
    pages.unshift({
      kind: 'dashboard',
      label: 'Dashboard',
      widgets: models.map(model => ({ kind: 'kpi-total', resource: model.name }))
    })
  }
  return { models, pages, dashboard, kpiModels: dashboard ? models : [], themeId: DEFAULT_THEME_ID }
}

/** Composición declarada por un app-schema; valida cada referencia contra el registro. */
export function composeApp(definition: AppDefinition, registry: Record<string, ResourceDefinition>): AppComposition {
  const resolve = (resource: string): ResourceDefinition => {
    const model = registry[resource]
    if (!model) {
      throw new Error(
        `App '${definition.name}' references unknown resource model '${resource}'. ` +
          `Available models: ${Object.keys(registry).join(', ')}`
      )
    }
    return model
  }

  const models: ResourceDefinition[] = []
  const include = (model: ResourceDefinition): void => {
    if (!models.includes(model)) models.push(model)
  }

  const kpiModels: ResourceDefinition[] = []
  const pages: ComposedPage[] = definition.pages.map(page => {
    if (page.kind === 'dashboard') {
      for (const widget of page.widgets) {
        const model = resolve(widget.resource)
        include(model)
        kpiModels.push(model)
      }
      return { ...page, label: page.label ?? 'Dashboard' }
    }
    const model = resolve(page.resource)
    include(model)
    return { ...page, label: page.label ?? labelOf(model) }
  })

  return {
    models,
    pages,
    dashboard: kpiModels.length > 0,
    kpiModels,
    themeId: resolveThemeId(definition.theme),
    ports: definition.ports
  }
}

function labelOf(model: ResourceDefinition): string {
  return model.labels?.plural ?? model.plural
}
