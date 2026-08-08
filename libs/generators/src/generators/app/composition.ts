import { DEFAULT_THEME_ID, resolveThemeId } from '@acc/schema'
import type { AppDefinition, BusinessBrief, BusinessFlow, PageDefinition, PortsDefinition, ResourceDefinition } from '@acc/schema'

/**
 * Composición normalizada de una app: el único vocabulario del que el generador
 * deriva nav, rutas, ruta por defecto y dashboard. Las opciones planas (models,
 * dashboard) y el app-schema (defineApp) convergen aquí — un solo camino de render.
 */
/** Página normalizada: el label del menú siempre queda resuelto al componer. */
export type ComposedPage = PageDefinition & { label: string }

/** Widget analítico resuelto contra el modelo (spec 32): listo para interpolar, sin lógica en plantilla. */
export interface ComposedAnalyticWidget {
  kind: 'count-by' | 'kpi-count' | 'series'
  /** Propiedad emitida en el DashboardService ('contractsByContractType') */
  property: string
  api: string
  field: string
  label: string
  /** count-by: valores del enum con su etiqueta legible (badgeMap → options → capitalizado) */
  values?: { value: string; label: string }[]
  /** kpi-count: el valor contado */
  equals?: string
}

export interface AppComposition {
  /** Modelos incluidos en la app (backend + servicio), en orden de aparición */
  models: ResourceDefinition[]
  /** Páginas con labels resueltos; su orden gobierna nav y rutas */
  pages: ComposedPage[]
  dashboard: boolean
  /** Modelos con tarjeta KPI en el dashboard, en orden de widget */
  kpiModels: ResourceDefinition[]
  /** Widgets analíticos del dashboard (spec 32), resueltos y validados contra los modelos */
  analytics?: ComposedAnalyticWidget[]
  /** Tema declarado por el app-schema (spec 20); siempre resuelto, 'neutral' por defecto */
  themeId: string
  /** Color de marca (fase 4); presente, gana al themeId */
  themeSeed?: string
  /** Puertos declarados en el app-schema; ausente = los del esqueleto */
  ports?: PortsDefinition
  /** Procesos de negocio (spec 28); aterrizan como sección del CLAUDE.md emitido */
  flows?: BusinessFlow[]
  /** Brief de negocio del app-schema (spec 22); aterriza como CLAUDE.md en la app generada */
  brief?: BusinessBrief
}

/** Composición histórica de las opciones planas: [dashboard?] + una página por modelo. */
export function composeFlat(models: ResourceDefinition[], dashboard: boolean): AppComposition {
  const pages: ComposedPage[] = models.flatMap(model => [
    { kind: 'resource' as const, resource: model.name, label: labelOf(model) },
    // una galería declarada sin vista que la muestre sería inalcanzable
    ...(model.gallery ? [{ kind: 'cards' as const, resource: model.name, label: `${labelOf(model)} · galería` }] : []),
    // ídem para el cronograma (spec 30)
    ...(model.gantt ? [{ kind: 'gantt' as const, resource: model.name, label: `${labelOf(model)} · cronograma` }] : [])
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
        // solo los totales llevan tarjeta propia; los analíticos (spec 32) tienen su sección
        if (widget.kind === 'kpi-total') kpiModels.push(model)
      }
      return { ...page, label: page.label ?? 'Dashboard' }
    }
    const model = resolve(page.resource)
    include(model)
    // el label por defecto distingue la vista, igual que la composición plana
    const suffix = page.kind === 'cards' ? ' · galería' : page.kind === 'gantt' ? ' · cronograma' : ''
    return { ...page, label: page.label ?? `${labelOf(model)}${suffix}` }
  })

  // Un corte que referencia a un modelo fuera lo INCLUYE como dependencia (sin página):
  // el emitido importa su id-VO y su servicio de lookup — sin el padre ni compila.
  for (let index = 0; index < models.length; index++) {
    for (const field of Object.values(models[index].fields ?? {})) {
      if (field.relation) include(resolve(field.relation.to))
    }
  }

  // los widgets analíticos (spec 32) se validan contra el modelo: campo real, filterable
  // y del tipo que el widget necesita — el error llega al diseñar, no al compilar
  const analytics: ComposedAnalyticWidget[] = []
  for (const page of definition.pages) {
    if (page.kind !== 'dashboard') continue
    for (const widget of page.widgets) {
      if (widget.kind === 'kpi-total') continue
      const model = resolve(widget.resource)
      const field = model.fields[widget.field]
      const at = `App '${definition.name}': widget ${widget.kind} '${widget.resource}.${widget.field}'`
      if (!field) throw new Error(`${at} references an unknown field`)
      if (!field.query?.filterable) throw new Error(`${at} requires a filterable field (the count uses the list endpoint)`)
      const api = model.api ?? `/api/v1/${model.plural}`
      const fieldLabel = field.table?.label ?? field.form?.label ?? widget.field
      if (widget.kind === 'count-by') {
        const values = (typeof field.vo === 'object' ? field.vo.values : undefined) ?? []
        if (!values.length) throw new Error(`${at} requires an enum field (vo.values)`)
        analytics.push({
          kind: 'count-by',
          property: propertyOf(`${model.plural}-by-${widget.field}`),
          api,
          field: widget.field,
          label: widget.label ?? fieldLabel,
          values: values.map(value => ({
            value,
            label:
              field.table?.badgeMap?.[value]?.label ??
              field.form?.options?.find(option => option.value === value)?.label ??
              value.charAt(0).toUpperCase() + value.slice(1)
          }))
        })
      } else if (widget.kind === 'series') {
        if (field.type !== 'date' && field.type !== 'timestamptz') {
          throw new Error(`${at} requires a date field`)
        }
        analytics.push({
          kind: 'series',
          property: propertyOf(`${model.plural}-series-${widget.field}`),
          api,
          field: widget.field,
          label: widget.label ?? fieldLabel
        })
      } else {
        analytics.push({
          kind: 'kpi-count',
          property: propertyOf(`${model.plural}-where-${widget.field}-${widget.equals}`),
          api,
          field: widget.field,
          label: widget.label,
          equals: widget.equals
        })
      }
    }
  }

  return {
    models,
    pages,
    dashboard: kpiModels.length > 0,
    kpiModels,
    ...(analytics.length ? { analytics } : {}),
    ...(definition.brief ? { brief: definition.brief } : {}),
    ...(definition.flows?.length ? { flows: definition.flows } : {}),
    themeId: resolveThemeId(definition.theme),
    ...(definition.theme?.seed ? { themeSeed: definition.theme.seed } : {}),
    ports: definition.ports
  }
}

function labelOf(model: ResourceDefinition): string {
  return model.labels?.plural ?? model.plural
}

/** kebab-ish a camelCase ('contracts-by-contract-type' → 'contractsByContractType'). */
function propertyOf(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, letter: string) => letter.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
}
