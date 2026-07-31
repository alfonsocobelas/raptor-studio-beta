import { Injectable, computed, signal } from '@angular/core'
import { defineApp, defineResource, type AppDefinition, type DashboardPage, type ResourceDefinition } from '@acc/schema'
import { composeApp, type AppComposition } from '@acc/generators/src/generators/app/composition'
import { draftToResource, newDraftResource, type DraftField, type DraftResource } from './draft-resource'

/** El diseño completo: nombre de app + entidades dibujadas + composición de páginas. */
export interface Design {
  appName: string
  resources: DraftResource[]
  pages: AppDefinition['pages']
}

const EMPTY_COMPOSITION: AppComposition = { models: [], pages: [], dashboard: false, kpiModels: [] }

/**
 * Fuente de verdad del lienzo en blanco: entidades DRAFT (creadas aquí, no de
 * ningún catálogo) + composición de páginas. Todo derivado; toda mutación pasa
 * el gate (defineResource por entidad; defineApp cuando hay páginas — un lienzo
 * vacío es un estado válido del diseño, no de la generación).
 */
@Injectable({ providedIn: 'root' })
export class DesignStore {
  private readonly _appName = signal('mi-app')
  private readonly _resources = signal<DraftResource[]>([])
  private readonly _pages = signal<AppDefinition['pages']>([])
  private readonly _lastError = signal<string | null>(null)

  readonly appName = this._appName.asReadonly()
  readonly resources = this._resources.asReadonly()
  readonly lastError = this._lastError.asReadonly()

  readonly definition = computed<AppDefinition>(() => ({
    schemaVersion: 1,
    name: this._appName(),
    pages: this._pages()
  }))

  /** Registro derivado SOLO de las entidades del diseño — nada de demos. */
  readonly registry = computed<Record<string, ResourceDefinition>>(() =>
    Object.fromEntries(this._resources().map(r => [r.name, draftToResource(r, this._appName())]))
  )

  readonly composition = computed<AppComposition>(() => {
    const pages = this._pages()
    if (!pages.length) return EMPTY_COMPOSITION
    return composeApp(this.definition(), this.registry())
  })

  /** El artefacto exportable/generable: app-schema + resource-schemas expandidos. */
  readonly exportJson = computed(() =>
    JSON.stringify(
      {
        ...this.definition(),
        resources: Object.values(this.registry())
      },
      null,
      2
    )
  )

  setAppName(name: string): void {
    if (name.trim()) this._appName.set(name.trim())
  }

  addTable(label: string): boolean {
    const draft = newDraftResource(label)
    if (this._resources().some(r => r.name === draft.name)) {
      this._lastError.set(`Ya existe una entidad «${draft.name}»`)
      return false
    }
    return this.mutate(
      [...this._resources(), draft],
      [...this._pages(), { kind: 'resource', resource: draft.name }]
    )
  }

  addKpi(resource: string): boolean {
    const widget = { kind: 'kpi-total' as const, resource }
    const pages = [...this._pages()]
    const dashboardIndex = pages.findIndex(p => p.kind === 'dashboard')
    if (dashboardIndex === -1) {
      return this.mutate(this._resources(), [{ kind: 'dashboard', widgets: [widget] }, ...pages])
    }
    const dashboard = pages[dashboardIndex] as DashboardPage
    if (dashboard.widgets.some(w => w.resource === resource)) {
      this._lastError.set(`Ya hay un KPI de «${resource}»`)
      return false
    }
    pages[dashboardIndex] = { ...dashboard, widgets: [...dashboard.widgets, widget] }
    return this.mutate(this._resources(), pages)
  }

  removeWidget(pageIndex: number, widgetIndex: number): boolean {
    const pages = [...this._pages()]
    const page = pages[pageIndex]
    if (page?.kind !== 'dashboard') return false
    const widgets = page.widgets.filter((_, i) => i !== widgetIndex)
    if (widgets.length) pages[pageIndex] = { ...page, widgets }
    else pages.splice(pageIndex, 1)
    return this.mutate(this._resources(), pages)
  }

  /** Borrar la página de una entidad = borrar la entidad entera (y sus KPIs). */
  removePage(index: number): boolean {
    const page = this._pages()[index]
    if (!page) return false
    let pages = this._pages().filter((_, i) => i !== index)
    let resources = this._resources()
    if (page.kind === 'resource') {
      resources = resources.filter(r => r.name !== page.resource)
      pages = pages
        .map(p =>
          p.kind === 'dashboard' ? { ...p, widgets: p.widgets.filter(w => w.resource !== page.resource) } : p
        )
        .filter(p => p.kind !== 'dashboard' || p.widgets.length > 0)
    }
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
      fields: [...draft.fields, { name: `campo${draft.fields.length + 1}`, label: `Campo ${draft.fields.length + 1}`, type: 'string' as const }]
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

  /** Propuesta completa del chat: se valida entera y se aplica o nada. */
  applyExternal(design: Design): boolean {
    try {
      const resources = design.resources.map(r => structuredClone(r))
      const registry = Object.fromEntries(
        resources.map(r => [r.name, defineResource(draftToResource(r, design.appName))])
      )
      if (design.pages.length) {
        const definition = defineApp(
          structuredClone({ schemaVersion: 1 as const, name: design.appName, pages: design.pages })
        )
        composeApp(definition, registry)
      }
      this._appName.set(design.appName)
      this._resources.set(resources)
      this._pages.set(structuredClone(design.pages))
      this._lastError.set(null)
      return true
    } catch (e) {
      this._lastError.set(e instanceof Error ? e.message : String(e))
      return false
    }
  }

  private updateResource(name: string, fn: (draft: DraftResource) => DraftResource): boolean {
    const resources = this._resources().map(r => (r.name === name ? fn(r) : r))
    return this.mutate(resources, this._pages())
  }

  /** Gate: cada entidad pasa defineResource; la app pasa defineApp si tiene páginas. */
  private mutate(resources: DraftResource[], pages: AppDefinition['pages']): boolean {
    try {
      const registry = Object.fromEntries(
        resources.map(r => [r.name, defineResource(draftToResource(r, this._appName()))])
      )
      if (pages.length) {
        const definition = defineApp(structuredClone({ schemaVersion: 1 as const, name: this._appName(), pages }))
        composeApp(definition, registry)
      }
      this._resources.set(resources)
      this._pages.set(pages)
      this._lastError.set(null)
      return true
    } catch (e) {
      this._lastError.set(e instanceof Error ? e.message : String(e))
      return false
    }
  }
}
