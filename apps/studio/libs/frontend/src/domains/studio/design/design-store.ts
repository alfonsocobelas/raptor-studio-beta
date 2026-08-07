import { Injectable, computed, signal } from '@angular/core'
import { defineApp, defineResource, type AppDefinition, type ResourceDefinition } from '@acc/schema'
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
  private readonly _lastError = signal<string | null>(null)

  readonly appName = this._appName.asReadonly()
  readonly resources = this._resources.asReadonly()
  readonly pages = this._pages.asReadonly()
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

  removeField(resource: string, index: number): boolean {
    return this.updateResource(resource, draft => ({
      ...draft,
      fields: draft.fields.filter((_, i) => i !== index)
    }))
  }

  /**
   * Traduce las vistas al app-schema que consume el generador: solo viajan las
   * composiciones que sabe emitir hoy (tabla → página de recurso; solo KPIs →
   * dashboard). El resto se reporta en notGenerable().
   */
  toAppSchema(): AppDefinition {
    return { schemaVersion: 1, name: this._appName(), pages: designPagesToAppPages(this._pages()) }
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
    return this.mutate(clone.resources, clone.pages, clone.appName)
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
      const schema = this.toAppSchema()
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
