import { Injectable, computed, signal } from '@angular/core'
import { defineApp, defineResource, type AppDefinition, type ResourceDefinition } from '@acc/schema'
import {
  GENERABLE_BLOCKS,
  VIEW_PRESETS,
  draftToResource,
  newDraftResource,
  type DesignBlock,
  type DesignPage,
  type DraftField,
  type DraftResource
} from '@app/shared/domain'

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
    Object.fromEntries(this._resources().map(r => [r.name, draftToResource(r, this._appName())]))
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
    return this.mutate(resources, [...this._pages(), { title, blocks }])
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
    const pages = this._pages().map((page, i) =>
      i === pageIndex ? { ...page, blocks: [...page.blocks, { width: 'full' as const, ...block }] } : page
    )
    const resources =
      block.kind === 'attachments' && block.resource
        ? this._resources().map(r => (r.name === block.resource ? { ...r, attachments: true } : r))
        : this._resources()
    return this.mutate(resources, pages)
  }

  removeBlock(pageIndex: number, blockIndex: number): boolean {
    const removed = this._pages()[pageIndex]?.blocks[blockIndex]
    const pages = this._pages().map((page, i) =>
      i === pageIndex ? { ...page, blocks: page.blocks.filter((_, j) => j !== blockIndex) } : page
    )
    const resources =
      removed?.kind === 'attachments' && removed.resource
        ? this._resources().map(r => (r.name === removed.resource ? { ...r, attachments: false } : r))
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
      fields: draft.fields.map((f, i) => (i === index ? { ...f, ...patch } : f))
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
    const pages: AppDefinition['pages'] = []
    for (const page of this._pages()) {
      const table = page.blocks.find(b => b.kind === 'table' && b.resource)
      const kpis = page.blocks.filter(b => b.kind === 'kpis').flatMap(b => b.resources ?? [])
      if (table?.resource) {
        pages.push({ kind: 'resource', resource: table.resource, label: page.title })
      } else if (kpis.length && !pages.some(p => p.kind === 'dashboard')) {
        pages.push({
          kind: 'dashboard',
          label: page.title,
          widgets: kpis.map(resource => ({ kind: 'kpi-total', resource }))
        })
      }
    }
    return { schemaVersion: 1, name: this._appName(), pages }
  }

  /** Vistas con bloques que el generador aún no emite (para avisar al usuario). */
  notGenerable(): { page: string; blocks: string[] }[] {
    return this._pages()
      .map(page => ({
        page: page.title,
        blocks: [...new Set(page.blocks.filter(b => !GENERABLE_BLOCKS.includes(b.kind)).map(b => b.kind))]
      }))
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
