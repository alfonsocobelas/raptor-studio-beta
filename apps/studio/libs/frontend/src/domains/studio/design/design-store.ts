import { Injectable, computed, signal } from '@angular/core'
import {
  BRIEF_LIMITS,
  FLOW_LIMITS,
  briefProblems,
  defineApp,
  defineResource,
  type AppDefinition,
  type BusinessBrief,
  type BusinessFlow,
  type FlowNode,
  type FlowNodeKind,
  type ResourceDefinition
} from '@acc/schema'
import {
  DETAIL_BLOCKS,
  GENERABLE_BLOCKS,
  VIEW_PRESETS,
  draftToResource,
  newDraftResource,
  type DesignBlock,
  type DesignPage,
  type DraftEnumValue,
  type DraftField,
  type DraftResource,
  designPagesToAppPages
} from '@app/shared/domain'

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

/** El diseño completo: nombre de app + entidades dibujadas + vistas con sus bloques. */
export interface Design {
  appName: string
  resources: DraftResource[]
  pages: DesignPage[]
  /** Procesos de negocio (spec 28); opcional para no romper diseños anteriores */
  flows?: BusinessFlow[]
  /** Contexto de negocio destilado del chat (spec 22); el usuario lo ve y lo corrige */
  brief?: BusinessBrief
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
  private readonly _lastError = signal<string | null>(null)

  readonly appName = this._appName.asReadonly()
  readonly resources = this._resources.asReadonly()
  readonly pages = this._pages.asReadonly()
  readonly flows = this._flows.asReadonly()
  readonly brief = this._brief.asReadonly()
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

  addBlock(pageIndex: number, block: DesignBlock): boolean {
    // La ficha es otra PANTALLA (el generador la emite en <ruta>/:id): sus
    // bloques nunca se apilan bajo el listado, se van a su propia vista.
    if (DETAIL_BLOCKS.includes(block.kind) && block.resource && !this._pages()[pageIndex]?.drillDown) {
      return this.addToDetailPage(block.resource, block)
    }
    const pages = this._pages().map((page, i) =>
      i === pageIndex ? { ...page, blocks: [...page.blocks, { width: 'full' as const, ...block }] } : page
    )
    if (block.kind === 'text') return this.mutate(this.withIntros(pages), pages)
    const resources =
      block.kind === 'attachments' && block.resource
        ? this._resources().map(r => (r.name === block.resource ? { ...r, attachments: true } : r))
        : block.kind === 'fields' && block.resource
          ? this._resources().map(r => (r.name === block.resource ? { ...r, detail: true } : r))
          : block.kind === 'cards' && block.resource
            ? this._resources().map(r => (r.name === block.resource ? { ...r, gallery: true } : r))
            : this._resources()
    return this.mutate(resources, pages)
  }

  /** Vistas que sí son navegación de primer nivel (las fichas se abren desde ellas). */
  menuPages(): DesignPage[] {
    return this._pages().filter(p => !p.drillDown)
  }

  /** Índice de la vista de ficha de una entidad, creándola si aún no existe. */
  private addToDetailPage(resource: string, block: DesignBlock): boolean {
    const label = this._resources().find(r => r.name === resource)?.labelSingular ?? resource
    const existing = this._pages().findIndex(p => p.drillDown && p.blocks.some(b => b.resource === resource))
    const entry = { width: 'full' as const, ...block }

    const pages =
      existing >= 0
        ? this._pages().map((page, i) =>
            i === existing && !page.blocks.some(b => b.kind === block.kind)
              ? { ...page, blocks: [...page.blocks, entry] }
              : page
          )
        : [...this._pages(), { title: `Ficha de ${label.toLowerCase()}`, blocks: [entry], drillDown: true }]

    const resources = this._resources().map(r =>
      r.name === resource ? { ...r, detail: true, ...(block.kind === 'attachments' ? { attachments: true } : {}) } : r
    )
    return this.mutate(resources, pages)
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
    return this.updateResource(resource, draft => ({
      ...draft,
      fields: draft.fields.map((f, i) => (i === index ? applyFieldPatch(f, patch) : f))
    }))
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
    return this.updateResource(resource, draft => ({
      ...draft,
      fields: draft.fields.filter((_, i) => i !== index)
    }))
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
    return this.updateFlow(flowName, flow => {
      const taken = new Set(flow.nodes.map(n => n.id))
      const base = slug(text)
      let id = base
      for (let i = 2; taken.has(id); i++) id = `${base}-${i}`
      return { ...flow, nodes: [...flow.nodes, { id, kind, text }] }
    })
  }

  updateFlowNode(flowName: string, id: string, patch: Partial<Omit<FlowNode, 'id'>>): boolean {
    return this.updateFlow(flowName, flow => ({
      ...flow,
      nodes: flow.nodes.map(n => (n.id === id ? { ...n, ...patch } : n))
    }))
  }

  /** Quitar un nodo arrastra sus aristas: nada puede quedar apuntando al hueco. */
  removeFlowNode(flowName: string, id: string): boolean {
    return this.updateFlow(flowName, flow => ({
      ...flow,
      nodes: flow.nodes.filter(n => n.id !== id),
      edges: flow.edges.filter(e => e.from !== id && e.to !== id)
    }))
  }

  addFlowEdge(flowName: string, from: string, to: string, label?: string): boolean {
    return this.updateFlow(flowName, flow => ({
      ...flow,
      edges: [...flow.edges, { from, to, ...(label !== undefined ? { label } : {}) }]
    }))
  }

  removeFlowEdge(flowName: string, from: string, to: string, label?: string): boolean {
    return this.updateFlow(flowName, flow => ({
      ...flow,
      edges: flow.edges.filter(e => !(e.from === from && e.to === to && e.label === label))
    }))
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
      pages: designPagesToAppPages(this._pages()),
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
                .filter(b => !GENERABLE_BLOCKS.includes(b.kind) && !(b.kind === 'text' && hasScreen))
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
