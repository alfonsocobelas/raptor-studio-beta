import { DEFAULT_THEME_ID, normalizeDashboardBlocks, opAllowedOn, operatorsFor, resolveThemeId } from '@raptor/schema'
import type {
  AppDefinition,
  DashboardBlock,
  FieldDefinition,
  KpiCondition,
  KpiMeasure,
  KpiWindow,
  BlockWidth,
  BusinessBrief,
  BusinessFlow,
  PageDefinition,
  PortsDefinition,
  ResourceDefinition
} from '@raptor/schema'

/**
 * Composición normalizada de una app: el único vocabulario del que el generador
 * deriva nav, rutas, ruta por defecto y dashboard. Las opciones planas (models,
 * dashboard) y el app-schema (defineApp) convergen aquí — un solo camino de render.
 */
/** Página normalizada: el label del menú siempre queda resuelto al componer. */
export type ComposedPage = PageDefinition & { label: string }

/**
 * Bloque del panel resuelto contra los modelos (spec 53): listo para interpolar, sin lógica en
 * plantilla. El ORDEN de la lista es el orden emitido, y `width` gobierna el agrupado en filas.
 */
export interface ComposedDashboardBlock {
  kind: 'metrics' | 'count-by' | 'kpi' | 'series' | 'table' | 'top-n'
  /** Resuelto al componer: 'full' si el diseño no lo declara */
  width: BlockWidth
  /** `metrics` lleva varios; el resto, exactamente uno */
  models: ResourceDefinition[]
  /** Propiedad emitida en el DashboardService ('contractsByContractType'); solo analíticos */
  property?: string
  api?: string
  field?: string
  label?: string
  /** count-by: valores del enum con su etiqueta legible (badgeMap → options → capitalizado) */
  values?: { value: string; label: string }[]
  /** count-by / series: la medida de las barras y el campo medido (spec 72) */
  measure?: KpiMeasure
  measureField?: string
  /** kpi: descriptor que el servicio emitido recibe tal cual (spec 70) */
  kpi?: ComposedKpi
  /** top-n: la página corta y ordenada que la tarjeta pinta (spec 70) */
  top?: ComposedTop
}

/** Lo que hace falta para resolver UNA tarjeta KPI; el rango de la ventana lo calcula el emitido. */
export interface ComposedKpi {
  /** 'count' sale del listado; el resto va al endpoint `aggregate` (spec 71) */
  measure: KpiMeasure
  /** Mini-serie de 12 meses en la tarjeta (spec 72); va en la misma petición agrupada */
  sparkline?: boolean
  /** Campo medido, y su tipo, cuando la medida no es un conteo */
  field?: string
  fieldKind?: 'numeric' | 'date'
  filters: KpiCondition[]
  window?: KpiWindow
  ratio: boolean
  compare: boolean
  target?: number
}

export interface ComposedTop {
  field: string
  n: number
  dir: 'asc' | 'desc'
  labelField: string
  labelHeader: string
  fieldHeader: string
}

export interface AppComposition {
  /** Modelos incluidos en la app (backend + servicio), en orden de aparición */
  models: ResourceDefinition[]
  /** Páginas con labels resueltos; su orden gobierna nav y rutas */
  pages: ComposedPage[]
  dashboard: boolean
  /** Bloques del panel resueltos, EN EL ORDEN EMITIDO (spec 53) */
  dashboardBlocks: ComposedDashboardBlock[]
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
    ...(model.gantt ? [{ kind: 'gantt' as const, resource: model.name, label: `${labelOf(model)} · cronograma` }] : []),
    // ídem para el calendario (spec 59)
    ...(model.calendar
      ? [{ kind: 'calendar' as const, resource: model.name, label: `${labelOf(model)} · calendario` }]
      : []),
    // ídem para el kanban (spec 61)
    ...(model.kanban ? [{ kind: 'kanban' as const, resource: model.name, label: `${labelOf(model)} · tablero` }] : [])
  ])
  if (dashboard) {
    pages.unshift({
      kind: 'dashboard',
      label: 'Dashboard',
      blocks: [{ kind: 'metrics', resources: models.map(model => model.name) }]
    })
  }
  return {
    models,
    pages,
    dashboard,
    // la composición plana es una fila de métricas y nada más: se conserva idéntica
    dashboardBlocks: dashboard ? [{ kind: 'metrics', width: 'full', models }] : [],
    themeId: DEFAULT_THEME_ID
  }
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

  const pages: ComposedPage[] = definition.pages.map(page => {
    if (page.kind === 'dashboard') {
      // todo recurso citado por un bloque del panel viaja en la app; `resolve` rechaza el que no
      // existe, así que el error llega al componer y no al compilar (spec 53)
      for (const block of page.blocks) {
        const resources = block.kind === 'metrics' ? block.resources : [block.resource]
        for (const resource of resources) include(resolve(resource))
      }
      return { ...page, label: page.label ?? 'Dashboard' }
    }
    const model = resolve(page.resource)
    include(model)
    // el label por defecto distingue la vista, igual que la composición plana
    const suffix =
      page.kind === 'cards'
        ? ' · galería'
        : page.kind === 'gantt'
          ? ' · cronograma'
          : page.kind === 'form'
            ? ' · formulario'
            : page.kind === 'calendar'
              ? ' · calendario'
              : page.kind === 'kanban'
                ? ' · tablero'
                : ''
    return { ...page, label: page.label ?? `${labelOf(model)}${suffix}` }
  })

  // Un corte que referencia a un modelo fuera lo INCLUYE como dependencia (sin página):
  // el emitido importa su id-VO y su servicio de lookup — sin el padre ni compila.
  for (let index = 0; index < models.length; index++) {
    for (const field of Object.values(models[index].fields ?? {})) {
      if (field.relation) include(resolve(field.relation.to))
    }
  }

  // Los bloques del panel se resuelven EN ORDEN (spec 53). Los analíticos (spec 32) se validan
  // contra el modelo —campo real, filterable y del tipo que el bloque necesita—: el error llega al
  // diseñar, no al compilar.
  const dashboardBlocks: ComposedDashboardBlock[] = []
  for (const page of definition.pages) {
    if (page.kind !== 'dashboard') continue
    // el alias `kpi-count` muere en la puerta: aquí abajo solo existe `kpi` (spec 70)
    for (const block of normalizeDashboardBlocks(page.blocks)) {
      // el defecto es POR KIND, y sale de lo que el emitido ya hacía: los analíticos siempre se
      // pintaron a dos columnas (media pantalla), la fila de métricas y el listado a lo ancho
      const width: BlockWidth = block.width ?? (block.kind === 'metrics' || block.kind === 'table' ? 'full' : 'half')
      if (block.kind === 'metrics') {
        dashboardBlocks.push({ kind: 'metrics', width, models: block.resources.map(resolve) })
        continue
      }
      const model = resolve(block.resource)
      if (block.kind === 'table') {
        dashboardBlocks.push({ kind: 'table', width, models: [model] })
        continue
      }
      if (block.kind === 'kpi') {
        dashboardBlocks.push(composeKpi(block, model, definition.name, width))
        continue
      }
      if (block.kind === 'top-n') {
        dashboardBlocks.push(composeTop(block, model, definition.name, width))
        continue
      }
      const field = model.fields[block.field]
      const at = `App '${definition.name}': widget ${block.kind} '${block.resource}.${block.field}'`
      if (!field) throw new Error(`${at} references an unknown field`)
      if (!field.query?.filterable) throw new Error(`${at} requires a filterable field (the count uses the list endpoint)`)
      const api = model.api ?? `/api/v1/${model.plural}`
      const fieldLabel = field.table?.label ?? field.form?.label ?? block.field
      if (block.kind === 'count-by') {
        const values = (typeof field.vo === 'object' ? field.vo.values : undefined) ?? []
        if (!values.length) throw new Error(`${at} requires an enum field (vo.values)`)
        const measured = measuredOf(block, model, at)
        dashboardBlocks.push({
          kind: 'count-by',
          width,
          models: [model],
          ...measured,
          property: propertyOf(`${model.plural}-by-${block.field}${measuredSlug(block)}`),
          api,
          field: block.field,
          label: block.label ?? fieldLabel,
          values: values.map(value => ({
            value,
            label:
              field.table?.badgeMap?.[value]?.label ??
              field.form?.options?.find(option => option.value === value)?.label ??
              value.charAt(0).toUpperCase() + value.slice(1)
          }))
        })
      } else if (block.kind === 'series') {
        if (field.type !== 'date' && field.type !== 'timestamptz') {
          throw new Error(`${at} requires a date field`)
        }
        const measuredSeries = measuredOf(block, model, at)
        dashboardBlocks.push({
          kind: 'series',
          width,
          models: [model],
          ...measuredSeries,
          property: propertyOf(`${model.plural}-series-${block.field}${measuredSlug(block)}`),
          api,
          field: block.field,
          label: block.label ?? fieldLabel
        })
      }
    }
  }

  // los estados que declaran los pasos (spec 39) se validan contra el enum del modelo:
  // dos declaraciones independientes —el enum y el flujo— que hablan del mismo negocio y
  // pueden divergir sin que nadie avise. Mismo criterio que los widgets analíticos: el
  // error llega al DISEÑAR, no al compilar. Solo en un sentido: un estado del enum que
  // ningún paso alcanza es legítimo ('cancelada' puede vivir fuera del flujo).
  //
  // Límite conocido: se compara contra los valores de TODOS los campos enum del modelo,
  // porque el modelo no dice cuál de ellos es «el estado». Caza erratas y divergencias
  // (que es el objetivo), no usos semánticamente torcidos: un valor de un enum de TIPO
  // pasaría el filtro. Cuando el estado se haga cumplir en el dominio habrá que nombrar
  // el campo; hoy sería una abstracción sin segundo caso (regla de los dos).
  for (const flow of definition.flows ?? []) {
    for (const node of flow.nodes) {
      if (node.status === undefined || node.entity === undefined) continue

      const model = resolve(node.entity)
      const at = `App '${definition.name}': flow '${flow.name}' step '${node.id}'`
      const values = Object.values(model.fields ?? {}).flatMap(field =>
        typeof field.vo === 'object' && field.vo.values ? field.vo.values : []
      )
      if (!values.length) {
        throw new Error(`${at} declares status '${node.status}' but '${node.entity}' has no enum field`)
      }
      if (!values.includes(node.status)) {
        throw new Error(`${at} declares unknown status '${node.status}'. Available: ${values.join(', ')}`)
      }
    }
  }

  return {
    models,
    pages,
    // un panel con solo analíticos también es un panel: antes se miraba si había métricas
    dashboard: dashboardBlocks.length > 0,
    dashboardBlocks,
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
/**
 * Resuelve una tarjeta KPI contra el modelo (spec 70). Todo lo que puede estar mal se caza AQUÍ,
 * al diseñar, no al compilar la app: campo inexistente, campo que la API no filtra, operador que
 * el tipo no admite y ventana sobre algo que no es una fecha. Un KPI mal condicionado no falla:
 * devuelve el total entero, en silencio, y eso es peor que un error.
 */
function composeKpi(
  block: Extract<DashboardBlock, { kind: 'kpi' }>,
  model: ResourceDefinition,
  appName: string,
  width: BlockWidth
): ComposedDashboardBlock {
  const at = `App '${appName}': kpi '${block.label}' on '${block.resource}'`

  const filters: KpiCondition[] = []
  if (block.condition) {
    const field = filterableFieldOf(model, block.condition.field, at)
    if (!operatorsFor(field).includes(block.condition.operator)) {
      throw new Error(
        `${at} uses operator '${block.condition.operator}', which '${block.condition.field}' does not admit`
      )
    }
    filters.push(block.condition)
  }

  if (block.window) {
    const field = filterableFieldOf(model, block.window.field, at)
    if (field.type !== 'date' && field.type !== 'timestamptz') {
      throw new Error(`${at} narrows by '${block.window.field}', which is not a date field`)
    }
  }

  // la medida de verdad mide un campo, y no todo campo se puede medir (spec 71)
  const measure = block.measure ?? 'count'
  let fieldKind: 'numeric' | 'date' | undefined
  if (measure !== 'count') {
    const measured = model.fields[block.field ?? '']
    if (!measured) throw new Error(`${at} measures an unknown field '${block.field}'`)
    fieldKind = aggregateKindOf(measured)
    if (!fieldKind) {
      throw new Error(`${at} measures '${block.field}', which is neither numeric nor a date`)
    }
    if (!opAllowedOn(measure, fieldKind)) {
      throw new Error(`${at} applies '${measure}' to a ${fieldKind} field, which has no answer`)
    }
  }

  return {
    kind: 'kpi',
    width,
    models: [model],
    // la huella entra en el nombre: dos KPIs del mismo campo son dos propiedades distintas
    property: propertyOf(`${model.plural}-kpi-${kpiSlug(block)}`),
    api: model.api ?? `/api/v1/${model.plural}`,
    label: block.label,
    kpi: {
      measure,
      ...(block.field ? { field: block.field } : {}),
      ...(fieldKind ? { fieldKind } : {}),
      filters,
      ...(block.window ? { window: block.window } : {}),
      ratio: block.ratio === true,
      compare: block.compare === true,
      ...(block.sparkline === true ? { sparkline: true } : {}),
      ...(block.target === undefined ? {} : { target: block.target })
    }
  }
}



/**
 * La medida de unas barras o de una serie (spec 72), validada contra el modelo: el campo medido
 * existe, se puede medir y la operación tiene respuesta sobre su tipo. Igual que en la tarjeta, el
 * error llega al DISEÑAR.
 */
function measuredOf(
  block: Extract<DashboardBlock, { kind: 'count-by' | 'series' }>,
  model: ResourceDefinition,
  at: string
): { measure?: KpiMeasure; measureField?: string } {
  const measure = block.measure ?? 'count'
  if (measure === 'count') return {}

  const field = model.fields[block.measureField ?? '']
  if (!field) throw new Error(`${at} measures an unknown field '${block.measureField}'`)
  const kind = aggregateKindOf(field)
  if (!kind) throw new Error(`${at} measures '${block.measureField}', which is neither numeric nor a date`)
  if (!opAllowedOn(measure, kind)) {
    throw new Error(`${at} applies '${measure}' to a ${kind} field, which has no answer`)
  }

  return { measure, measureField: block.measureField }
}

/** Sufijo de la propiedad emitida: una suma y un conteo del mismo eje son dos bloques distintos. */
function measuredSlug(block: Extract<DashboardBlock, { kind: 'count-by' | 'series' }>): string {
  const measure = block.measure ?? 'count'
  return measure === 'count' ? '' : `-${measure}-${block.measureField}`
}

/** El tipo agregable de un campo, o undefined si no se puede medir (spec 71). */
function aggregateKindOf(field: FieldDefinition): 'numeric' | 'date' | undefined {
  if (field.type === 'number' || field.type === 'integer') return 'numeric'
  if (field.type === 'date' || field.type === 'timestamptz') return 'date'
  return undefined
}

/** Nombre estable y único de la propiedad emitida: la config, no la etiqueta. */
function kpiSlug(block: Extract<DashboardBlock, { kind: 'kpi' }>): string {
  const condition = block.condition
  const window = block.window
  const measured = block.measure !== undefined && block.measure !== 'count'
  return [
    measured ? `${block.measure}-${block.field}` : '',
    // «total» solo nombra el conteo sin condición: con medida, la medida ya nombra la tarjeta
    condition ? `${condition.field}-${condition.operator}-${condition.value}` : measured ? '' : 'total',
    window ? `${window.field}-${window.preset}${window.days ?? ''}` : '',
    block.ratio === true ? 'ratio' : '',
    block.compare === true ? 'delta' : '',
    block.target === undefined ? '' : `target${block.target}`,
    block.sparkline === true ? 'spark' : ''
  ]
    .filter(part => part !== '')
    .join('-')
}

function composeTop(
  block: Extract<DashboardBlock, { kind: 'top-n' }>,
  model: ResourceDefinition,
  appName: string,
  width: BlockWidth
): ComposedDashboardBlock {
  const at = `App '${appName}': top-n on '${block.resource}.${block.field}'`
  const field = fieldOf(model, block.field, at)
  if (!field.query?.sortable) throw new Error(`${at} requires a sortable field (the list endpoint sorts it)`)

  const labelField = block.labelField ?? defaultLabelField(model)
  // la etiqueta de la fila es DISPLAY: sale de la página ya pedida, ni filtra ni ordena
  const labelDefinition = model.fields[labelField]
  if (!labelDefinition) throw new Error(`${at} references an unknown label field '${labelField}'`)

  return {
    kind: 'top-n',
    width,
    models: [model],
    property: propertyOf(`${model.plural}-top-${block.field}-${block.n}-${block.dir ?? 'desc'}`),
    api: model.api ?? `/api/v1/${model.plural}`,
    field: block.field,
    label: block.label ?? `Top ${block.n} · ${labelOf2(field, block.field)}`,
    top: {
      field: block.field,
      n: block.n,
      dir: block.dir ?? 'desc',
      labelField,
      labelHeader: labelOf2(labelDefinition, labelField),
      fieldHeader: labelOf2(field, block.field)
    }
  }
}


/**
 * El campo con el que se NOMBRA un registro en la lista corta. No vale un 'name' a fuego: en el
 * canon ni contract ni project tienen ese campo. Se toma el que el listado ya usa para nombrar
 * (el de la confirmación de borrado), y si no hay, el primer campo buscable —que es justo el que
 * la tabla emitida enseña como identidad—.
 */
function defaultLabelField(model: ResourceDefinition): string {
  const declared = model.list?.deleteLabelField
  if (declared) return declared

  const searchable = Object.entries(model.fields).find(([, field]) => field.query?.searchable)
  if (searchable) return searchable[0]

  const text = Object.entries(model.fields).find(([, field]) => field.type === 'string')
  return text ? text[0] : 'name'
}

function fieldOf(model: ResourceDefinition, name: string, at: string): FieldDefinition {
  const field = model.fields[name]
  if (!field) throw new Error(`${at} references an unknown field '${name}'`)
  if (!field.query?.filterable && !field.query?.sortable) {
    throw new Error(`${at} needs '${name}' to be filterable or sortable in the list endpoint`)
  }
  return field
}

/**
 * La condición y la ventana del KPI se convierten en FILTROS del listado, y el emitido los valida
 * contra allowedFilters: aceptar aquí un campo solo-ordenable era regalar un 400 al abrir el panel
 * (revisión spec 70-72). El error tiene que llegar al diseñar.
 */
function filterableFieldOf(model: ResourceDefinition, name: string, at: string): FieldDefinition {
  const field = model.fields[name]
  if (!field) throw new Error(`${at} references an unknown field '${name}'`)
  if (!field.query?.filterable) {
    throw new Error(`${at} needs '${name}' to be filterable (the emitted list validates filters against it)`)
  }
  return field
}

/** Etiqueta humana de un campo, con el nombre crudo como último recurso. */
function labelOf2(field: FieldDefinition, name: string): string {
  return field.table?.label ?? field.form?.label ?? name
}

function propertyOf(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, letter: string) => letter.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '')
}
