import { Injectable, computed, signal } from '@angular/core'
import {
  BRIEF_LIMITS,
  FLOW_LIMITS,
  briefProblems,
  defineApp,
  defineResource,
  type AccessDefinition,
  type AppDefinition,
  type BusinessBrief,
  type BusinessFlow,
  type FlowEdge,
  type FlowNode,
  type StateMachine,
  type FlowNodeKind,
  type PortsDefinition,
  type ResourceDefinition
} from '@raptor/schema'
import {
  FLOW_BRANCHES,
  VIEW_PRESETS,
  draftToResource,
  generableHere,
  newDraftResource,
  reorderFlowStep,
  type DesignBlock,
  type DesignPage,
  type DraftCalendar,
  type DraftEnumValue,
  type DraftKanban,
  type DraftField,
  type DraftResource,
  designPagesToAppPages
} from '@app/shared/domain'

/** Sin campo enum no hay tablero que generar: la entidad no lleva config (spec 61). */
function kanbanConfigOf(block: DesignBlock): DraftKanban | undefined {
  if (!block.columnsField) return undefined
  return {
    field: block.columnsField,
    ...(block.labelField ? { labelField: block.labelField } : {})
  }
}

/** Sin campo fecha no hay calendario que generar: la entidad no lleva config (spec 59). */
function calendarConfigOf(block: DesignBlock): DraftCalendar | undefined {
  if (!block.dateField) return undefined
  return {
    dateField: block.dateField,
    ...(block.labelField ? { labelField: block.labelField } : {}),
    ...(block.colorField ? { colorField: block.colorField } : {}),
    ...(block.weekends === false ? { weekends: false } : {})
  }
}

/** «orden-compra» → «ordenCompra»: los nombres de entidad son kebab y los de campo camel. */
function camel(kebab: string): string {
  return kebab.replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

/** «¿Reservar depósito?» → «reservar-deposito»: el id de nodo de flujo es un slug del texto. */
function slug(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'nodo'
  )
}

/** Id libre para un nodo nuevo: el slug del texto, y si está pillado, sufijo numérico. */
function freeNodeId(flow: BusinessFlow, text: string): string {
  const taken = new Set(flow.nodes.map(node => node.id))
  const base = slug(text)
  let id = base
  for (let i = 2; taken.has(id); i++) id = `${base}-${i}`
  return id
}

/**
 * Gate ligero de los flujos MIENTRAS se dibujan (spec 28): identidad,
 * referencias y topes. Un nodo suelto o una decisión con una sola salida son
 * legales aquí; la forma completa (aridad, alcanzabilidad) la exige defineApp
 * en la frontera, igual que DraftResource respecto a defineResource.
 */
function flowDraftProblem(flows: BusinessFlow[]): string | null {
  if (flows.length > FLOW_LIMITS.flows) return `Como mucho ${FLOW_LIMITS.flows} flujos por diseño`

  const names = new Set<string>()
  for (const flow of flows) {
    if (names.has(flow.name)) return `Ya existe el flujo «${flow.name}»`
    names.add(flow.name)
    if (!flow.name.length || flow.name.length > FLOW_LIMITS.name) {
      return `El nombre del flujo debe tener entre 1 y ${FLOW_LIMITS.name} caracteres`
    }
    if (flow.description !== undefined && flow.description.length > FLOW_LIMITS.description) {
      return `La descripción de «${flow.name}» supera los ${FLOW_LIMITS.description} caracteres`
    }
    if (flow.nodes.length > FLOW_LIMITS.nodes) return `«${flow.name}» supera los ${FLOW_LIMITS.nodes} nodos`
    if (flow.edges.length > FLOW_LIMITS.edges) return `«${flow.name}» supera las ${FLOW_LIMITS.edges} conexiones`

    const ids = new Set<string>()
    for (const node of flow.nodes) {
      if (ids.has(node.id)) return `Nodo duplicado «${node.id}» en «${flow.name}»`
      ids.add(node.id)
      if (!node.text.length || node.text.length > FLOW_LIMITS.text) {
        return `El texto de un nodo debe tener entre 1 y ${FLOW_LIMITS.text} caracteres`
      }
    }

    const seen = new Set<string>()
    for (const edge of flow.edges) {
      if (edge.from === edge.to) return `Un nodo no puede conectarse consigo mismo («${edge.from}»)`
      if (!ids.has(edge.from) || !ids.has(edge.to)) {
        return `Una conexión de «${flow.name}» apunta a un nodo inexistente`
      }
      const key = `${edge.from}→${edge.to}→${edge.label ?? ''}`
      if (seen.has(key)) return `Ya existe la conexión ${edge.from} → ${edge.to}`
      seen.add(key)
      if (edge.label !== undefined && (!edge.label.length || edge.label.length > FLOW_LIMITS.label)) {
        return `La etiqueta de una conexión debe tener entre 1 y ${FLOW_LIMITS.label} caracteres`
      }
    }
  }
  return null
}

/** Valores de partida al convertir una columna en enum: un enum vacío no se genera. */
const STARTER_ENUM_VALUES: DraftEnumValue[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'cerrado', label: 'Cerrado' }
]

/**
 * Aplica el cambio a un campo cuidando lo que el TIPO arrastra: al pasar a enum
 * hace falta un conjunto con el que empezar, y al dejar de serlo los valores no
 * pueden quedar colgando en el schema.
 */
function applyFieldPatch(field: DraftField, patch: Partial<DraftField>): DraftField {
  const merged = { ...field, ...patch }
  if (patch.type === undefined) return merged

  if (patch.type === 'enum') {
    return { ...merged, values: merged.values?.length ? merged.values : [...STARTER_ENUM_VALUES] }
  }
  const { values: _discarded, ...withoutValues } = merged
  return withoutValues
}

/** La máquina cae si su ancla ya no está (o dejó de ser enum): nunca queda huérfana. */
function dropStateIfOrphan(draft: DraftResource, anchorName: string | undefined): DraftResource {
  if (!draft.state || draft.state.field !== anchorName) return draft
  const { state: _dropped, ...rest } = draft
  return rest
}

/** El diseño completo: nombre de app + entidades dibujadas + vistas con sus bloques. */
export interface Design {
  appName: string
  resources: DraftResource[]
  pages: DesignPage[]
  /** Procesos de negocio (spec 28); opcional para no romper diseños anteriores */
  flows?: BusinessFlow[]
  /** Contexto de negocio destilado del chat (spec 22); el usuario lo ve y lo corrige */
  brief?: BusinessBrief
  /** Puertos con los que la app correrá en local; ausente = los defectos del generador */
  ports?: PortsDefinition
}

/**
 * Fuente de verdad del lienzo (ADR-009): VISTAS compuestas de BLOQUES. La tabla
 * es un bloque más — opcional, como los ficheros. Las entidades son drafts
 * creados aquí (nunca de un catálogo) y toda mutación pasa por el gate.
 */
@Injectable({ providedIn: 'root' })
export class DesignStore {
  private readonly _appName = signal('mi-app')
  private readonly _resources = signal<DraftResource[]>([])
  private readonly _pages = signal<DesignPage[]>([])
  private readonly _flows = signal<BusinessFlow[]>([])
  private readonly _brief = signal<BusinessBrief | undefined>(undefined)
  private readonly _ports = signal<PortsDefinition | undefined>(undefined)
  private readonly _lastError = signal<string | null>(null)

  readonly appName = this._appName.asReadonly()
  readonly resources = this._resources.asReadonly()
  readonly pages = this._pages.asReadonly()
  readonly flows = this._flows.asReadonly()
  readonly brief = this._brief.asReadonly()
  readonly ports = this._ports.asReadonly()
  readonly lastError = this._lastError.asReadonly()

  /** Resource-schemas canónicos derivados de las entidades del diseño. */
  readonly registry = computed<Record<string, ResourceDefinition>>(() =>
    Object.fromEntries(this._resources().map(r => [r.name, draftToResource(r, this._appName(), this._resources())]))
  )

  readonly exportJson = computed(() =>
    JSON.stringify({ ...this.toAppSchema(), resources: Object.values(this.registry()) }, null, 2)
  )

  setAppName(name: string): void {
    if (name.trim()) this._appName.set(name.trim())
  }

  /**
   * Puertos con los que se levantará la app emitida. Viven en el diseño porque el
   * autosave lo reescribe entero: lo que el lienzo no modela, lo borra.
   */
  setPorts(ports: PortsDefinition | undefined): void {
    this._ports.set(ports)
  }

  /** El brief de la app pasa por los MISMOS topes que el schema (spec 22). */
  setBrief(brief: BusinessBrief | undefined): boolean {
    const problems = briefProblems(brief)
    if (problems.length) {
      this._lastError.set(`El brief no pasa el gate: ${problems.join('; ')}`)
      return false
    }
    this._brief.set(brief)
    this._lastError.set(null)
    return true
  }


  /**
   * Las ETIQUETAS de una entidad: singular, plural, género y entradilla (2026-08-27). El
   * identificador (`name`, `plural`) NO se toca: lo referencian los bloques, las páginas y las
   * relaciones, y de él salen las rutas y los esquemas de la app emitida — renombrarlo es otra
   * operación, con su migración.
   *
   * El género no es adorno: de él dependen los textos del emitido («El cliente» / «La factura»).
   */
  setResourceLabels(
    name: string,
    patch: { labelSingular?: string; labelPlural?: string; gender?: 'm' | 'f'; subtitle?: string }
  ): boolean {
    const target = this._resources().find(r => r.name === name)
    if (!target) {
      this._lastError.set(`No existe la entidad «${name}»`)
      return false
    }

    const singular = patch.labelSingular?.trim()
    const plural = patch.labelPlural?.trim()
    if (patch.labelSingular !== undefined && !singular) {
      this._lastError.set('El nombre en singular no puede quedar vacío')
      return false
    }
    if (patch.labelPlural !== undefined && !plural) {
      this._lastError.set('El nombre en plural no puede quedar vacío')
      return false
    }

    return this.updateResource(name, draft => {
      const updated = {
        ...draft,
        ...(singular ? { labelSingular: singular } : {}),
        ...(plural ? { labelPlural: plural } : {}),
        ...(patch.gender ? { gender: patch.gender } : {})
      }
      if (patch.subtitle === undefined) return updated
      // la entradilla vacía se quita, no se guarda en blanco (mismo criterio que el brief)
      const trimmed = patch.subtitle.trim()
      if (!trimmed) {
        const { subtitle: _gone, ...rest } = updated
        return rest
      }
      return { ...updated, subtitle: trimmed }
    })
  }

  /** La frase de negocio de una entidad; el texto vacío la quita. */
  setResourceBrief(name: string, text: string): boolean {
    const trimmed = text.trim()
    if (trimmed.length > BRIEF_LIMITS.entity) {
      this._lastError.set(`El brief de ${name} excede ${BRIEF_LIMITS.entity} caracteres`)
      return false
    }
    return this.updateResource(name, draft => {
      if (!trimmed) {
        const { brief: _gone, ...rest } = draft
        return rest
      }
      return { ...draft, brief: trimmed }
    })
  }

  /** Crea una vista a partir de un preset; los presets con datos crean su entidad. */
  addPage(presetId: string, label: string): boolean {
    const preset = VIEW_PRESETS.find(p => p.id === presetId)
    if (!preset) return false
    const title = label.trim() || 'Vista'

    let resources = this._resources()
    let resourceName: string | undefined
    if (presetId !== 'blank') {
      const draft = newDraftResource(title)
      resourceName = draft.name
      if (!resources.some(r => r.name === draft.name)) resources = [...resources, draft]
    }

    const blocks = preset.blocks(resourceName)
    // un bloque de adjuntos implica que la entidad los declara
    if (resourceName && blocks.some(b => b.kind === 'attachments')) {
      resources = resources.map(r => (r.name === resourceName ? { ...r, attachments: true } : r))
    }
    if (resourceName && blocks.some(b => b.kind === 'fields')) {
      resources = resources.map(r => (r.name === resourceName ? { ...r, detail: true } : r))
    }
    if (resourceName && blocks.some(b => b.kind === 'cards')) {
      resources = resources.map(r => (r.name === resourceName ? { ...r, gallery: true } : r))
    }
    const page: DesignPage = { title, blocks, ...(preset.drillDown ? { drillDown: true } : {}) }
    return this.mutate(resources, [...this._pages(), page])
  }

  /** Entidad suelta (sin vista): para componer a mano después. */
  addResource(label: string): boolean {
    const draft = newDraftResource(label)
    if (this._resources().some(r => r.name === draft.name)) {
      this._lastError.set(`Ya existe la entidad «${draft.name}»`)
      return false
    }
    return this.mutate([...this._resources(), draft], this._pages())
  }

  /**
   * Un segundo panel de KPIs en la misma vista no existe: son la misma fila de
   * métricas. Soltar KPIs donde ya los hay SUMA una entidad al bloque que está
   * —la que traiga el gesto si aún falta, y si no la primera del modelo sin
   * medir—, en vez de crear un bloque gemelo que el gate rechazaría por widget
   * duplicado. Sin entidades que añadir no hay nada que hacer, y se dice.
   */
  private addKpiResource(pageIndex: number, incoming: string[]): boolean {
    const page = this._pages()[pageIndex]
    const index = page.blocks.findIndex(block => block.kind === 'kpis')
    const measured = page.blocks[index].resources ?? []
    const next =
      incoming.find(resource => !measured.includes(resource)) ??
      this._resources().find(r => !measured.includes(r.name))?.name

    if (!next) {
      this._lastError.set(`«${page.title}» ya mide todas las entidades del modelo`)
      return false
    }

    const blocks = page.blocks.map((block, i) =>
      i === index ? { ...block, resources: [...measured, next] } : block
    )
    return this.mutate(
      this._resources(),
      this._pages().map((p, i) => (i === pageIndex ? { ...p, blocks } : p))
    )
  }

  /** `at` es el hueco donde cae el bloque al soltarlo; sin él se apila al final. */
  addBlock(pageIndex: number, block: DesignBlock, at?: number): boolean {
    if (block.kind === 'kpis' && this._pages()[pageIndex]?.blocks.some(b => b.kind === 'kpis')) {
      return this.addKpiResource(pageIndex, block.resources ?? [])
    }
    // el calendario nace apuntando al primer campo fecha de la entidad (spec 59)
    const added =
      block.kind === 'calendar' && block.resource && !block.dateField
        ? {
            ...block,
            dateField: this._resources()
              .find(r => r.name === block.resource)
              ?.fields.find(f => f.type === 'date')?.name
          }
        : // el kanban nace en el campo de la máquina de estados, o el primer enum (spec 61)
          block.kind === 'kanban' && block.resource && !block.columnsField
          ? { ...block, columnsField: this.defaultKanbanField(block.resource) }
          : // el top-n nace con 5 filas y el primer campo numérico de la entidad (spec 70)
            block.kind === 'top-n' && block.resource && !block.topField
            ? {
                ...block,
                topN: block.topN ?? 5,
                topDir: block.topDir ?? ('desc' as const),
                topField: this._resources()
                  .find(r => r.name === block.resource)
                  ?.fields.find(f => f.type === 'number' || f.type === 'integer')?.name
              }
            : block
    const pages = this._pages().map((page, i) => {
      if (i !== pageIndex) return page
      const blocks = [...page.blocks]
      blocks.splice(at ?? blocks.length, 0, { width: 'full' as const, ...added })
      return { ...page, blocks }
    })
    if (block.kind === 'text') return this.mutate(this.withIntros(pages), pages)
    // La ficha del registro la emite el generador desde las BANDERAS de la entidad,
    // no desde la composición: por eso el bloque puede vivir donde se suelte y aun
    // así lo que se genera es coherente — la zona de ficheros aparece en la ficha.
    const resources =
      block.kind === 'attachments' && block.resource
        ? this._resources().map(r => (r.name === block.resource ? { ...r, detail: true, attachments: true } : r))
        : block.kind === 'fields' && block.resource
          ? this._resources().map(r => (r.name === block.resource ? { ...r, detail: true } : r))
          : block.kind === 'cards' && block.resource
            ? this._resources().map(r => (r.name === block.resource ? { ...r, gallery: true } : r))
            : block.kind === 'form' && block.resource
              ? this._resources().map(r => (r.name === block.resource ? { ...r, form: true } : r))
              : block.kind === 'calendar' && block.resource
                ? this._resources().map(r =>
                    r.name === block.resource ? { ...r, calendar: calendarConfigOf(added) } : r
                  )
                : block.kind === 'kanban' && block.resource
                  ? this._resources().map(r =>
                      r.name === block.resource ? { ...r, kanban: kanbanConfigOf(added) } : r
                    )
                  : this._resources()
    return this.mutate(resources, pages)
  }

  /** Campo de columnas propuesto para un kanban recién soltado (spec 61). */
  private defaultKanbanField(resource: string): string | undefined {
    const draft = this._resources().find(r => r.name === resource)
    if (!draft) return undefined
    return draft.state?.field ?? draft.fields.find(f => f.type === 'enum')?.name
  }

  /** Config del panel del bloque kanban (spec 61): vive en el bloque y se replica en la entidad. */
  setKanbanConfig(
    pageIndex: number,
    blockIndex: number,
    patch: Partial<Pick<DesignBlock, 'columnsField' | 'labelField'>>
  ): boolean {
    const page = this._pages()[pageIndex]
    const block = page?.blocks[blockIndex]
    if (!block || block.kind !== 'kanban') return false
    const updated = { ...block, ...patch }
    const pages = this._pages().map((p, i) =>
      i === pageIndex ? { ...p, blocks: p.blocks.map((b, j) => (j === blockIndex ? updated : b)) } : p
    )
    const resources = this._resources().map(r =>
      r.name === block.resource ? { ...r, kanban: kanbanConfigOf(updated) } : r
    )
    return this.mutate(resources, pages)
  }



  /**
   * Qué entidades mide la fila de KPIs (spec 70, seguimiento). La fila es UN bloque con N
   * tarjetas: sin esto, la ✕ del lienzo se llevaba la fila entera y no había manera de quitar
   * una sola tarjeta (reportado 2026-08-27).
   *
   * Se rechaza dejarla vacía —no mediría nada— y se rechazan repetidas: dos veces la misma
   * entidad son dos tarjetas idénticas.
   */
  setKpiResources(pageIndex: number, blockIndex: number, resources: string[]): boolean {
    const page = this._pages()[pageIndex]
    const block = page?.blocks[blockIndex]
    if (!block || block.kind !== 'kpis') return false
    if (!resources.length) {
      this._lastError.set('La fila de KPIs tiene que medir al menos una entidad')
      return false
    }
    if (new Set(resources).size !== resources.length) {
      this._lastError.set('La fila de KPIs no puede medir dos veces la misma entidad')
      return false
    }
    const known = this._resources().map(r => r.name)
    const unknown = resources.find(resource => !known.includes(resource))
    if (unknown) {
      this._lastError.set(`«${unknown}» no está en el modelo`)
      return false
    }

    const pages = this._pages().map((p, i) =>
      i === pageIndex
        ? { ...p, blocks: p.blocks.map((b, j) => (j === blockIndex ? { ...b, resources } : b)) }
        : p
    )
    return this.mutate(this._resources(), pages)
  }

  /**
   * Config de los bloques KPI y Top N (spec 70). A diferencia del calendario y el kanban, NO se
   * replica en la entidad: una tarjeta es de la vista, no del modelo — la misma entidad puede
   * tener cinco tarjetas distintas en el mismo panel.
   *
   * Dos reglas se hacen cumplir aquí y no solo en el panel, porque el diseño se puede editar por
   * otras vías (el chat, un JSON pegado): ratio y objetivo son excluyentes, y sin ventana no hay
   * comparación posible.
   */
  setKpiConfig(pageIndex: number, blockIndex: number, patch: Partial<DesignBlock>): boolean {
    const page = this._pages()[pageIndex]
    const block = page?.blocks[blockIndex]
    if (!block || (block.kind !== 'kpi' && block.kind !== 'top-n')) return false

    const updated: DesignBlock = { ...block, ...patch }
    // el select vacío llega como '': eso es «sin ventana», no una ventana llamada ''
    if (updated.kpiWindowPreset === '') delete updated.kpiWindowPreset
    if (updated.kpiWindowField === '') delete updated.kpiWindowField
    if (updated.kpiConditionField === '') {
      delete updated.kpiConditionField
      delete updated.kpiConditionOperator
      delete updated.kpiConditionValue
    }
    if (patch.kpiRatio === true) delete updated.kpiTarget
    if (patch.kpiTarget !== undefined) delete updated.kpiRatio
    if (!updated.kpiWindowPreset) delete updated.kpiCompare
    if (updated.kpiWindowPreset !== 'days') delete updated.kpiWindowDays

    const pages = this._pages().map((p, i) =>
      i === pageIndex ? { ...p, blocks: p.blocks.map((b, j) => (j === blockIndex ? updated : b)) } : p
    )
    return this.mutate(this._resources(), pages)
  }

  /** Config del panel del bloque calendario (spec 59): vive en el bloque y se replica en la entidad. */
  setCalendarConfig(
    pageIndex: number,
    blockIndex: number,
    patch: Partial<Pick<DesignBlock, 'dateField' | 'labelField' | 'colorField' | 'weekends'>>
  ): boolean {
    const page = this._pages()[pageIndex]
    const block = page?.blocks[blockIndex]
    if (!block || block.kind !== 'calendar') return false
    const updated = { ...block, ...patch }
    const pages = this._pages().map((p, i) =>
      i === pageIndex ? { ...p, blocks: p.blocks.map((b, j) => (j === blockIndex ? updated : b)) } : p
    )
    const resources = this._resources().map(r =>
      r.name === block.resource ? { ...r, calendar: calendarConfigOf(updated) } : r
    )
    return this.mutate(resources, pages)
  }

  /** Vistas que sí son navegación de primer nivel (las fichas se abren desde ellas). */
  menuPages(): DesignPage[] {
    return this._pages().filter(p => !p.drillDown)
  }

  /**
   * El texto de una vista es la ENTRADILLA de la pantalla que esa vista emite
   * (spec 18): el generador emite un componente por pantalla, no compone
   * bloques, así que el texto se pega al listado o galería que lo acompaña.
   */
  private withIntros(pages: DesignPage[]): DraftResource[] {
    const intros = new Map<string, string>()
    for (const page of pages) {
      const text = page.blocks.find(b => b.kind === 'text')?.text?.trim()
      if (!text) continue
      for (const block of page.blocks) {
        if ((block.kind === 'table' || block.kind === 'cards') && block.resource && !intros.has(block.resource)) {
          intros.set(block.resource, text)
        }
      }
    }
    return this._resources().map(r => (intros.has(r.name) ? { ...r, subtitle: intros.get(r.name) } : r))
  }

  removeBlock(pageIndex: number, blockIndex: number): boolean {
    const removed = this._pages()[pageIndex]?.blocks[blockIndex]
    const pages = this._pages().map((page, i) =>
      i === pageIndex ? { ...page, blocks: page.blocks.filter((_, j) => j !== blockIndex) } : page
    )
    const resources =
      removed?.kind === 'attachments' && removed.resource
        ? this._resources().map(r => (r.name === removed.resource ? { ...r, attachments: false } : r))
        : removed?.kind === 'fields' && removed.resource
          ? this._resources().map(r => (r.name === removed.resource ? { ...r, detail: false } : r))
          : removed?.kind === 'cards' && removed.resource
            ? this._resources().map(r => (r.name === removed.resource ? { ...r, gallery: false } : r))
            : removed?.kind === 'form' && removed.resource
              ? this._resources().map(r => (r.name === removed.resource ? { ...r, form: false } : r))
              : removed?.kind === 'calendar' && removed.resource
                ? this._resources().map(r => (r.name === removed.resource ? { ...r, calendar: undefined } : r))
                : removed?.kind === 'kanban' && removed.resource
                  ? this._resources().map(r => (r.name === removed.resource ? { ...r, kanban: undefined } : r))
                  : this._resources()
    return this.mutate(resources, pages)
  }

  moveBlock(pageIndex: number, from: number, to: number): boolean {
    const pages = this._pages().map((page, i) => {
      if (i !== pageIndex) return page
      const blocks = [...page.blocks]
      const [moved] = blocks.splice(from, 1)
      blocks.splice(to, 0, moved)
      return { ...page, blocks }
    })
    return this.mutate(this._resources(), pages)
  }

  setBlockWidth(pageIndex: number, blockIndex: number, width: 'full' | 'half'): boolean {
    const pages = this._pages().map((page, i) =>
      i === pageIndex ? { ...page, blocks: page.blocks.map((b, j) => (j === blockIndex ? { ...b, width } : b)) } : page
    )
    return this.mutate(this._resources(), pages)
  }

  renamePage(pageIndex: number, title: string): boolean {
    const pages = this._pages().map((page, i) =>
      i === pageIndex ? { ...page, title: title.trim() || page.title } : page
    )
    return this.mutate(this._resources(), pages)
  }

  /** Borra la vista; la entidad solo se va si ninguna otra vista la usa. */
  removePage(pageIndex: number): boolean {
    const pages = this._pages().filter((_, i) => i !== pageIndex)
    const stillUsed = new Set(pages.flatMap(p => p.blocks.flatMap(b => [b.resource, ...(b.resources ?? [])])))
    const resources = this._resources().filter(r => stillUsed.has(r.name))
    return this.mutate(resources, pages)
  }

  /**
   * Borra la entidad y arrastra lo que la usaba: sus bloques caen, y con ellos la
   * vista que se quede vacía —era solo suya y en el menú sería basura—; una vista
   * con más contenido sobrevive sin ellos, y una ya vacía de antes no se toca. Los
   * KPIs compartidos solo la dejan de medir, y las relaciones entrantes de otras
   * entidades se van con ella — un `ref` a una entidad que ya no existe no
   * pasaría el gate.
   */
  removeResource(name: string): boolean {
    if (!this._resources().some(r => r.name === name)) {
      this._lastError.set(`No existe la entidad «${name}»`)
      return false
    }
    const resources = this._resources()
      .filter(r => r.name !== name)
      .map(r => ({ ...r, fields: r.fields.filter(f => !(f.type === 'ref' && f.refTo === name)) }))
    const pages = this._pages()
      .map(page => ({
        ...page,
        blocks: page.blocks
          .filter(b => b.resource !== name)
          .map(b => (b.resources?.includes(name) ? { ...b, resources: b.resources.filter(x => x !== name) } : b))
          .filter(b => !(b.kind === 'kpis' && !b.resources?.length))
      }))
      .filter((page, i) => page.blocks.length > 0 || this._pages()[i].blocks.length === 0)
    return this.mutate(resources, pages)
  }

  movePage(from: number, to: number): boolean {
    const pages = [...this._pages()]
    const [moved] = pages.splice(from, 1)
    pages.splice(to, 0, moved)
    return this.mutate(this._resources(), pages)
  }

  addField(resource: string): boolean {
    return this.updateResource(resource, draft => ({
      ...draft,
      fields: [
        ...draft.fields,
        { name: `campo${draft.fields.length + 1}`, label: `Campo ${draft.fields.length + 1}`, type: 'string' as const }
      ]
    }))
  }

  updateField(resource: string, index: number, patch: Partial<DraftField>): boolean {
    return this.updateResource(resource, draft => {
      const patched = {
        ...draft,
        fields: draft.fields.map((f, i) => (i === index ? applyFieldPatch(f, patch) : f))
      }
      // si el ancla dejó de ser enum, la máquina se va con el cambio (spec 43)
      const anchor = patched.fields[index]
      const anchorBroken = draft.state?.field === anchor?.name && anchor?.type !== 'enum'
      return anchorBroken ? dropStateIfOrphan(patched, anchor?.name) : patched
    })
  }

  /**
   * La flecha del diagrama (spec 15, fase 4): crea en `from` un campo `ref`
   * real hacia `to` — exactamente el mismo que declararía el editor de columnas,
   * así que draftToResource lo expande al par canónico id + nombre.
   */
  addRelation(from: string, to: string): boolean {
    if (from === to) {
      this._lastError.set(`Una entidad no puede referenciarse a sí misma («${from}»)`)
      return false
    }
    const origin = this._resources().find(r => r.name === from)
    const target = this._resources().find(r => r.name === to)
    if (!origin || !target) {
      this._lastError.set(`No existe la entidad «${origin ? to : from}»`)
      return false
    }

    // el nombre del campo sale del destino; si ya hay otra ref con ese nombre, se sufija
    const taken = new Set(origin.fields.map(f => f.name))
    const base = camel(target.name)
    let name = base
    for (let i = 2; taken.has(name); i++) name = `${base}${i}`
    const label = name === base ? target.labelSingular : `${target.labelSingular} ${name.slice(base.length)}`

    return this.updateResource(from, draft => ({
      ...draft,
      fields: [...draft.fields, { name, label, type: 'ref', refTo: to }]
    }))
  }

  /**
   * Apunta un campo existente a otra entidad, o le quita el destino. Es la otra
   * puerta a las relaciones —la primera es arrastrar el asa— y aplica las mismas
   * reglas: ni a sí misma, ni a una entidad que no existe. Al quitar el destino
   * el campo vuelve a ser texto: un `ref` sin `refTo` no significa nada.
   */
  setFieldRef(resource: string, index: number, refTo: string | null): boolean {
    if (refTo === resource) {
      this._lastError.set(`Una entidad no puede referenciarse a sí misma («${resource}»)`)
      return false
    }
    if (refTo && !this._resources().some(r => r.name === refTo)) {
      this._lastError.set(`No existe la entidad «${refTo}»`)
      return false
    }
    const field = this._resources().find(r => r.name === resource)?.fields[index]
    if (!field) {
      this._lastError.set(`No existe la columna ${index} de «${resource}»`)
      return false
    }

    return this.updateResource(resource, draft => ({
      ...draft,
      fields: draft.fields.map((f, i) => {
        if (i !== index) return f
        if (refTo) return { ...f, type: 'ref' as const, refTo }
        const { refTo: _gone, ...withoutRef } = f
        return { ...withoutRef, type: 'string' as const }
      })
    }))
  }

  /** Borrar una flecha del diagrama: solo puede tocar campos `ref`, nunca otro campo por error. */
  removeRelation(resource: string, fieldIndex: number): boolean {
    const field = this._resources().find(r => r.name === resource)?.fields[fieldIndex]
    if (field?.type !== 'ref') {
      this._lastError.set(`El campo ${fieldIndex} de «${resource}» no es una relación`)
      return false
    }
    return this.removeField(resource, fieldIndex)
  }

  /**
   * Reordena una columna. No es cosmético: el orden de `fields` es el de las
   * columnas de la tabla y de los campos de la ficha en el código emitido.
   */
  moveField(resource: string, from: number, to: number): boolean {
    const fields = this._resources().find(r => r.name === resource)?.fields
    if (!fields || from < 0 || to < 0 || from >= fields.length || to >= fields.length) {
      this._lastError.set(`No se puede mover la columna ${from} de «${resource}» a ${to}`)
      return false
    }
    return this.updateResource(resource, draft => {
      const next = [...draft.fields]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return { ...draft, fields: next }
    })
  }

  /**
   * Copia una columna justo detrás de la original. Una relación se copia como
   * TEXTO, no como otra `ref`: dos flechas idénticas entre las mismas entidades
   * serían un modelo que nadie quiso dibujar.
   */
  duplicateField(resource: string, index: number): boolean {
    const fields = this._resources().find(r => r.name === resource)?.fields
    const original = fields?.[index]
    if (!fields || !original) {
      this._lastError.set(`No existe la columna ${index} de «${resource}»`)
      return false
    }

    const taken = new Set(fields.map(f => f.name))
    let name = `${original.name}2`
    for (let i = 3; taken.has(name); i++) name = `${original.name}${i}`

    const { refTo: _discarded, ...withoutRef } = original
    const copy: DraftField =
      original.type === 'ref'
        ? { ...withoutRef, name, label: `${original.label} (copia)`, type: 'string' }
        : { ...original, name, label: `${original.label} (copia)` }

    return this.updateResource(resource, draft => ({
      ...draft,
      fields: [...draft.fields.slice(0, index + 1), copy, ...draft.fields.slice(index + 1)]
    }))
  }

  removeField(resource: string, index: number): boolean {
    return this.updateResource(resource, draft => {
      const removed = draft.fields[index]
      const survivor = { ...draft, fields: draft.fields.filter((_, i) => i !== index) }
      // sin su campo ancla la máquina no habla de nada: se va con él (spec 43)
      return dropStateIfOrphan(survivor, removed?.name)
    })
  }

  /**
   * Promueve un campo enum a estado de la entidad (spec 43): nace la máquina con el
   * primer valor como inicial y sin transiciones — las flechas se dibujan después.
   */
  promoteState(resource: string, fieldName: string): boolean {
    const field = this._resources()
      .find(r => r.name === resource)
      ?.fields.find(f => f.name === fieldName)
    if (!field || field.type !== 'enum' || !field.values?.length) {
      this._lastError.set(`«${fieldName}» no es un campo enum con valores: no se puede promover a estado`)
      return false
    }
    return this.updateResource(resource, draft => ({
      ...draft,
      state: { field: fieldName, initial: field.values![0].value, transitions: [] }
    }))
  }

  /** Quita la máquina entera; la confirmación (tira las transiciones) es de quien llama. */
  demoteState(resource: string): boolean {
    return this.updateResource(resource, draft => {
      const { state: _dropped, ...rest } = draft
      return rest
    })
  }

  /**
   * La flecha del diagrama de estados (spec 43). Nombre propuesto `a-<destino>`; si ese
   * verbo ya existe hacia el mismo destino, la flecha nueva se AGRUPA como otro origen —
   * dos flechas con el mismo verbo son una transición con dos orígenes.
   */
  addTransition(resource: string, from: string, to: string): boolean {
    return this.mutateState(resource, machine => {
      // el verbo emite ruta y método: kebab siempre, aunque el valor del enum sea snake
      const name = `a-${to.replace(/_/g, '-')}`
      const existing = machine.transitions.find(t => t.name === name && t.to === to)
      if (existing) {
        return {
          ...machine,
          transitions: machine.transitions.map(t =>
            t === existing && !t.from.includes(from) ? { ...t, from: [...t.from, from] } : t
          )
        }
      }
      const label = this.stateValueLabel(resource, to)
      return {
        ...machine,
        transitions: [...machine.transitions, { name, label: `A ${label.toLowerCase()}`, from: [from], to }]
      }
    })
  }

  /** Renombrar el verbo o su label; el gate rechaza duplicados hacia destinos distintos. */
  updateTransition(resource: string, name: string, patch: { name?: string; label?: string }): boolean {
    return this.mutateState(resource, machine => ({
      ...machine,
      transitions: machine.transitions.map(t =>
        t.name === name ? { ...t, ...(patch.name ? { name: patch.name } : {}), ...(patch.label ? { label: patch.label } : {}) } : t
      )
    }))
  }

  /** Borra UNA flecha (un origen); la transición cae entera al perder el último. */
  removeTransition(resource: string, name: string, from: string): boolean {
    return this.mutateState(resource, machine => ({
      ...machine,
      transitions: machine.transitions
        .map(t => (t.name === name ? { ...t, from: t.from.filter(origin => origin !== from) } : t))
        .filter(t => t.from.length > 0)
    }))
  }

  setInitialState(resource: string, value: string): boolean {
    return this.mutateState(resource, machine => ({ ...machine, initial: value }))
  }

  /** La matriz de accesos de una entidad (spec 46); undefined la quita (vuelve la política actual). */
  setResourceAccess(name: string, access: AccessDefinition | undefined): boolean {
    return this.updateResource(name, draft => {
      if (!access) {
        const { access: _gone, ...rest } = draft
        return rest
      }
      return { ...draft, access }
    })
  }

  /** Toda mutación de la máquina pasa por el MISMO gate que el resto del recurso. */
  private mutateState(resource: string, fn: (machine: StateMachine) => StateMachine): boolean {
    const machine = this._resources().find(r => r.name === resource)?.state
    if (!machine) {
      this._lastError.set(`«${resource}» no tiene máquina de estados`)
      return false
    }
    return this.updateResource(resource, draft => ({ ...draft, state: fn(machine) }))
  }

  private stateValueLabel(resource: string, value: string): string {
    const draft = this._resources().find(r => r.name === resource)
    const field = draft?.fields.find(f => f.name === draft.state?.field)
    return field?.values?.find(v => v.value === value)?.label ?? value
  }

  /**
   * Flujos de negocio (spec 28). El store es PERMISIVO mientras se dibuja
   * (un nodo suelto es legal); la forma completa —aridad, alcanzabilidad—
   * la exige defineApp en la frontera, como con DraftResource.
   */
  addFlow(name: string): boolean {
    return this.mutateFlows([
      ...this._flows(),
      {
        name,
        nodes: [
          { id: 'inicio', kind: 'start', text: 'Inicio' },
          { id: 'fin', kind: 'end', text: 'Fin' }
        ],
        edges: [{ from: 'inicio', to: 'fin' }]
      }
    ])
  }

  removeFlow(name: string): boolean {
    return this.mutateFlows(this._flows().filter(f => f.name !== name))
  }

  renameFlow(name: string, next: string): boolean {
    return this.mutateFlows(this._flows().map(f => (f.name === name ? { ...f, name: next.trim() || f.name } : f)))
  }

  addFlowNode(flowName: string, kind: FlowNodeKind, text: string): boolean {
    return this.updateFlow(flowName, flow => ({
      ...flow,
      nodes: [...flow.nodes, { id: freeNodeId(flow, text), kind, text }]
    }))
  }

  updateFlowNode(flowName: string, id: string, patch: Partial<Omit<FlowNode, 'id'>>): boolean {
    return this.updateFlow(flowName, flow => ({
      ...flow,
      nodes: flow.nodes.map(n => (n.id === id ? { ...n, ...patch } : n))
    }))
  }

  /**
   * Quitar un nodo arrastra sus aristas y RECOSE la cadena: quien le apuntaba pasa a
   * apuntar a quien le seguía. Es el inverso exacto de insertFlowStep, y por el mismo
   * motivo la etiqueta que sobrevive es la de ENTRADA: es la que dice de qué rama de
   * una decisión cuelga el tramo. Sin recosido, borrar un paso del medio dejaba todo
   * lo de detrás inalcanzable y el lienzo lo apilaba en la capa de los huérfanos.
   */
  removeFlowNode(flowName: string, id: string): boolean {
    return this.updateFlow(flowName, flow => {
      const entradas = flow.edges.filter(e => e.to === id && e.from !== id)
      const salidas = flow.edges.filter(e => e.from === id && e.to !== id)
      const supervivientes = flow.edges.filter(e => e.from !== id && e.to !== id)

      const recosidas = entradas.flatMap(entrada =>
        salidas
          .filter(salida => salida.to !== entrada.from)
          .map(salida => ({
            from: entrada.from,
            to: salida.to,
            ...(entrada.label !== undefined ? { label: entrada.label } : {})
          }))
      )
      const yaEsta = (candidata: FlowEdge, edges: FlowEdge[]) =>
        edges.some(e => e.from === candidata.from && e.to === candidata.to && e.label === candidata.label)

      const edges = [...supervivientes]
      for (const candidata of recosidas) if (!yaEsta(candidata, edges)) edges.push(candidata)

      return { ...flow, nodes: flow.nodes.filter(n => n.id !== id), edges }
    })
  }

  addFlowEdge(flowName: string, from: string, to: string, label?: string): boolean {
    // '' es el aviso de flowBranchLabel: las dos ramas de la decisión ya están puestas.
    // Dejarlo pasar acababa en «la etiqueta debe tener entre 1 y 20 caracteres», un
    // error críptico de un campo que el usuario nunca escribió.
    if (label === '') {
      const texto = this._flows()
        .find(f => f.name === flowName)
        ?.nodes.find(n => n.id === from)?.text
      this._lastError.set(
        `Las salidas «sí» y «no» de «${texto ?? from}» ya están dibujadas: borra una para redirigirla`
      )
      return false
    }
    return this.updateFlow(flowName, flow => ({
      ...flow,
      edges: [...flow.edges, { from, to, ...(label !== undefined ? { label } : {}) }]
    }))
  }

  /**
   * Inserta un paso EN MEDIO de un tramo: el «+» de la referencia. El tramo original
   * se parte en dos y la etiqueta se queda en la primera mitad, que es la que sigue
   * saliendo de la decisión — moverla al segundo tramo cambiaría de rama el resto.
   */
  insertFlowStep(flowName: string, from: string, to: string, text: string, label?: string): boolean {
    return this.insertFlowNode(flowName, from, to, 'step', text, label)
  }

  /**
   * La forma general del insert: también admite meter una CONDICIÓN en el tramo, que
   * es el gesto de encadenar decisiones. El camino que ya existía sigue siendo el
   * principal: la salida de la condición nueva hacia el destino original nace con el
   * «sí», y la rama «no» queda pendiente de dibujar (el gate de borrador lo permite).
   */
  insertFlowNode(flowName: string, from: string, to: string, kind: FlowNodeKind, text: string, label?: string): boolean {
    const flow = this._flows().find(f => f.name === flowName)
    const tramo = flow?.edges.find(edge => edge.from === from && edge.to === to && edge.label === label)
    if (!flow || !tramo) {
      this._lastError.set(`No existe el tramo ${from} → ${to} en «${flowName}»`)
      return false
    }

    const id = freeNodeId(flow, text)
    const salida = kind === 'decision' ? { from: id, to, label: FLOW_BRANCHES[0] } : { from: id, to }

    return this.updateFlow(flowName, current => ({
      ...current,
      nodes: [...current.nodes, { id, kind, text }],
      edges: current.edges.flatMap(edge =>
        edge === tramo || (edge.from === from && edge.to === to && edge.label === label)
          ? [{ from, to: id, ...(label ? { label } : {}) }, salida]
          : [edge]
      )
    }))
  }

  /**
   * El «+ Acción» de la tarjeta: cuelga un paso DETRÁS de otro. Si el de delante ya
   * llevaba a algún sitio, el paso nuevo se mete en medio (la cadena no se rompe);
   * si no llevaba a ninguno, la tarjeta simplemente crece por abajo.
   */
  appendFlowStep(flowName: string, afterId: string, text: string): boolean {
    const flow = this._flows().find(f => f.name === flowName)
    if (!flow?.nodes.some(node => node.id === afterId)) {
      this._lastError.set(`No existe el nodo ${afterId} en «${flowName}»`)
      return false
    }
    const salida = flow.edges.find(edge => edge.from === afterId)
    if (salida) return this.insertFlowStep(flowName, afterId, salida.to, text, salida.label)

    // de una sola mutación: el nodo y su tramo entran juntos o no entran
    const id = freeNodeId(flow, text)
    return this.updateFlow(flowName, current => ({
      ...current,
      nodes: [...current.nodes, { id, kind: 'step' as const, text }],
      edges: [...current.edges, { from: afterId, to: id }]
    }))
  }

  removeFlowEdge(flowName: string, from: string, to: string, label?: string): boolean {
    return this.updateFlow(flowName, flow => ({
      ...flow,
      edges: flow.edges.filter(e => !(e.from === from && e.to === to && e.label === label))
    }))
  }

  /**
   * Mueve una acción a otra fila de SU tarjeta (spec 40). El recableado lo hace el dominio;
   * aquí solo se decide si hay algo que guardar: si el flujo vuelve idéntico —soltar la fila
   * donde ya estaba—, no se sustituye nada, y así el gesto en vacío no ensucia el diseño.
   */
  reorderFlowStep(flowName: string, stepId: string, toIndex: number): boolean {
    const flow = this._flows().find(f => f.name === flowName)
    if (!flow) {
      this._lastError.set(`No existe el flujo «${flowName}»`)
      return false
    }
    const reordenado = reorderFlowStep(flow, stepId, toIndex)
    if (reordenado === flow) return true
    return this.mutateFlows(this._flows().map(f => (f.name === flowName ? reordenado : f)))
  }

  private updateFlow(name: string, fn: (flow: BusinessFlow) => BusinessFlow): boolean {
    if (!this._flows().some(f => f.name === name)) {
      this._lastError.set(`No existe el flujo «${name}»`)
      return false
    }
    return this.mutateFlows(this._flows().map(f => (f.name === name ? fn(f) : f)))
  }

  private mutateFlows(flows: BusinessFlow[]): boolean {
    const problem = flowDraftProblem(flows)
    if (problem) {
      this._lastError.set(problem)
      return false
    }
    this._flows.set(flows)
    this._lastError.set(null)
    return true
  }

  /**
   * Traduce las vistas al app-schema que consume el generador: solo viajan las
   * composiciones que sabe emitir hoy (tabla → página de recurso; solo KPIs →
   * dashboard). El resto se reporta en notGenerable(). Los flujos viajan tal
   * cual; su forma completa la valida la frontera.
   */
  toAppSchema(): AppDefinition {
    return {
      schemaVersion: 1,
      name: this._appName(),
      pages: designPagesToAppPages(
        this._pages(),
        resource => this._resources().find(r => r.name === resource)?.labelPlural ?? resource
      ),
      ...(this._flows().length ? { flows: this._flows() } : {}),
      ...(this._brief() ? { brief: this._brief() } : {})
    }
  }

  /**
   * Vistas con bloques que el generador aún no emite. Un texto NO cuenta si la
   * vista lleva tabla o galería: ahí se emite como entradilla de la pantalla.
   */
  notGenerable(): { page: string; blocks: string[] }[] {
    return this._pages()
      .map(page => {
        const hasScreen = page.blocks.some(b => (b.kind === 'table' || b.kind === 'cards') && b.resource)
        return {
          page: page.title,
          blocks: [
            ...new Set(
              page.blocks
                .filter(b => !generableHere(page, b) && !(b.kind === 'text' && hasScreen))
                .map(b => b.kind)
            )
          ]
        }
      })
      .filter(entry => entry.blocks.length > 0)
  }

  applyExternal(design: Design): boolean {
    const clone = structuredClone(design)
    const flows = clone.flows ?? []
    const problem = flowDraftProblem(flows)
    if (problem) {
      this._lastError.set(problem)
      return false
    }
    // el brief externo pasa el mismo gate ANTES de mutar nada: rechazado entero o aplicado entero
    const briefIssues = briefProblems(clone.brief)
    if (briefIssues.length) {
      this._lastError.set(`El brief no pasa el gate: ${briefIssues.join('; ')}`)
      return false
    }
    if (!this.mutate(clone.resources, clone.pages, clone.appName)) return false
    this._flows.set(flows)
    // sin brief en el diseño externo, se borra: el diseño aplicado es la verdad completa
    this._brief.set(clone.brief)
    this._ports.set(clone.ports)
    return true
  }

  private updateResource(name: string, fn: (draft: DraftResource) => DraftResource): boolean {
    return this.mutate(
      this._resources().map(r => (r.name === name ? fn(r) : r)),
      this._pages()
    )
  }

  /** Gate: entidades por defineResource, referencias de los bloques y app-schema por defineApp. */
  private mutate(resources: DraftResource[], pages: DesignPage[], appName?: string): boolean {
    const name = appName ?? this._appName()
    const previous = { resources: this._resources(), pages: this._pages(), name: this._appName() }
    try {
      const registry = Object.fromEntries(resources.map(r => [r.name, defineResource(draftToResource(r, name))]))
      for (const page of pages) {
        for (const block of page.blocks) {
          const refs = [block.resource, ...(block.resources ?? [])].filter(Boolean) as string[]
          for (const ref of refs) {
            if (!registry[ref]) {
              throw new Error(`La vista «${page.title}» referencia una entidad inexistente: ${ref}`)
            }
          }
        }
      }
      this._appName.set(name)
      this._resources.set(resources)
      this._pages.set(pages)
      // sin los flujos: pueden estar a medio dibujar y su forma completa es cosa de la frontera
      const { flows: _drafts, ...schema } = this.toAppSchema()
      if (schema.pages.length) defineApp(structuredClone(schema))
      this._lastError.set(null)
      return true
    } catch (e) {
      this._appName.set(previous.name)
      this._resources.set(previous.resources)
      this._pages.set(previous.pages)
      this._lastError.set(e instanceof Error ? e.message : String(e))
      return false
    }
  }
}
