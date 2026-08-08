import { HttpClient } from '@angular/common/http'
import { Injectable, effect, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { DesignStore, type Design } from './design-store'

/** El diseño ACTIVO es estado de la ventana; los diseños son del proyecto (disco). */
export const ACTIVE_DESIGN_KEY = 'studio.activeDesign'

export interface DesignSummary {
  slug: string
  appName: string
  updatedAt: string
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Historial de diseños (spec 21): autosave con reposo contra el REST local y
 * restauración al arrancar. Nada entra al lienzo sin pasar por applyExternal
 * (el gate), y nada se escribe si no cambió: el effect compara la
 * serialización con la última guardada, así restaurar no provoca un eco.
 */
@Injectable({ providedIn: 'root' })
export class DesignHistoryService {
  private readonly http = inject(HttpClient)
  private readonly store = inject(DesignStore)

  readonly designs = signal<DesignSummary[]>([])
  readonly activeSlug = signal<string | null>(localStorage.getItem(ACTIVE_DESIGN_KEY))
  readonly saveState = signal<SaveState>('idle')
  readonly lastProblem = signal<string | null>(null)

  private timer: ReturnType<typeof setTimeout> | null = null
  private lastSaved = this.serialize()

  constructor() {
    effect(() => {
      const current = this.serialize() // lee TODOS los signals del diseño: es la dependencia
      if (current === this.lastSaved) return
      if (this.timer) clearTimeout(this.timer)
      // una ráfaga de tecleo = una escritura tras el reposo
      this.timer = setTimeout(() => void this.saveNow(), 1000)
    })
  }

  /** Restaura el activo (si lo hay) y refresca la lista. Llamar una vez al arrancar. */
  async init(): Promise<void> {
    const slug = this.activeSlug()
    if (slug) await this.load(slug)
    await this.refresh()
  }

  /** Cambia de diseño guardando ANTES lo pendiente: nada se pierde por navegar. */
  async select(slug: string): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.serialize() !== this.lastSaved) await this.saveNow()
    await this.load(slug)
    await this.refresh()
  }

  /** Lienzo vacío como diseño nuevo; el anterior queda intacto en disco. */
  async createNew(): Promise<void> {
    if (this.serialize() !== this.lastSaved) await this.saveNow()
    this.setActive(null)
    this.store.applyExternal({ appName: 'mi-app', resources: [], pages: [] })
    this.lastSaved = this.serialize()
    await this.refresh()
  }

  /** Renombrar = escribir con el slug nuevo y borrar el viejo (YAGNI: sin endpoint propio). */
  async rename(nextSlug: string): Promise<void> {
    const previous = this.activeSlug()
    this.setActive(this.claimSlug(nextSlug))
    await this.saveNow()
    if (previous && previous !== this.activeSlug()) {
      await firstValueFrom(this.http.delete(`/api/v1/studio/designs/${previous}`))
    }
    await this.refresh()
  }

  async remove(slug: string): Promise<void> {
    await firstValueFrom(this.http.delete(`/api/v1/studio/designs/${slug}`))
    if (this.activeSlug() === slug) {
      this.setActive(null)
      this.store.applyExternal({ appName: 'mi-app', resources: [], pages: [] })
      this.lastSaved = this.serialize()
    }
    await this.refresh()
  }

  async refresh(): Promise<void> {
    try {
      this.designs.set(await firstValueFrom(this.http.get<DesignSummary[]>('/api/v1/studio/designs')))
    } catch {
      /* sin API local no hay lista; el lienzo sigue funcionando */
    }
  }

  private async load(slug: string): Promise<void> {
    try {
      const design = await firstValueFrom(this.http.get<Design>(`/api/v1/studio/designs/${slug}`))
      if (!this.store.applyExternal(design)) {
        this.saveState.set('error')
        this.lastProblem.set(`El diseño «${slug}» no pasa el gate: ${this.store.lastError() ?? 'diseño inválido'}`)
        return
      }
      this.lastSaved = this.serialize() // restaurar no es editar: sin eco de guardado
      this.setActive(slug)
      this.saveState.set('idle')
      this.lastProblem.set(null)
    } catch (e) {
      // corrupto o inexistente: lienzo vacío con el motivo, y el fichero se queda donde está
      this.saveState.set('error')
      this.lastProblem.set(problemOf(e, slug))
    }
  }

  private async saveNow(): Promise<void> {
    const design = this.snapshot()
    const slug = this.activeSlug() ?? this.claimSlug(design.appName)
    const serialized = JSON.stringify(design)
    this.saveState.set('saving')
    try {
      await firstValueFrom(this.http.put(`/api/v1/studio/designs/${slug}`, design))
      this.lastSaved = serialized
      this.setActive(slug)
      this.saveState.set('saved')
      this.lastProblem.set(null)
    } catch (e) {
      this.saveState.set('error')
      this.lastProblem.set(problemOf(e, slug))
    }
  }

  /** Slug derivado del appName, esquivando los ya listados («vetcare-2»). */
  private claimSlug(raw: string): string {
    const base = kebab(raw) || 'diseno'
    const taken = new Set(this.designs().map(d => d.slug))
    let slug = base
    for (let i = 2; taken.has(slug) && slug !== this.activeSlug(); i++) slug = `${base}-${i}`
    return slug
  }

  private setActive(slug: string | null): void {
    this.activeSlug.set(slug)
    if (slug) localStorage.setItem(ACTIVE_DESIGN_KEY, slug)
    else localStorage.removeItem(ACTIVE_DESIGN_KEY)
  }

  private snapshot(): Design {
    return {
      appName: this.store.appName(),
      resources: this.store.resources(),
      pages: this.store.pages(),
      ...(this.store.flows().length ? { flows: this.store.flows() } : {}),
      ...(this.store.brief() ? { brief: this.store.brief() } : {})
    }
  }

  private serialize(): string {
    return JSON.stringify(this.snapshot())
  }
}

function problemOf(e: unknown, slug: string): string {
  const detail =
    typeof e === 'object' && e !== null && 'error' in e
      ? (e as { error?: { message?: string } }).error?.message
      : undefined
  return detail ?? `No se pudo guardar o cargar «${slug}» (¿está el studio-api levantado?)`
}

function kebab(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
