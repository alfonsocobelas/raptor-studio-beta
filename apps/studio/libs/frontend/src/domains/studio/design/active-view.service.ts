import { Injectable, computed, inject, signal } from '@angular/core'
import { DesignStore } from './design-store'

/**
 * Qué se está editando: la vista dibujada, la entidad elegida y, dentro de ella,
 * la columna. Vive fuera de los lienzos porque lo comparten el panel de vistas,
 * el diagrama, el lienzo y el inspector, y se clampa contra el diseño: borrar la
 * última vista —o la columna elegida— no puede dejar apuntando a un hueco.
 */
@Injectable({ providedIn: 'root' })
export class ActiveViewService {
  private readonly store = inject(DesignStore)
  private readonly _index = signal(0)
  private readonly _resource = signal<string | null>(null)
  private readonly _field = signal<number | null>(null)

  readonly index = computed(() => Math.min(this._index(), Math.max(this.store.pages().length - 1, 0)))

  /** Entidad cuyo detalle enseña el inspector; null cuando no hay nada elegido. */
  readonly resource = this._resource.asReadonly()

  /** Columna elegida dentro de la entidad; null si no hay, o si ya no existe. */
  readonly field = computed(() => {
    const index = this._field()
    if (index === null) return null
    const fields = this.store.resources().find(r => r.name === this._resource())?.fields
    return fields && index < fields.length ? index : null
  })

  select(index: number): void {
    this._index.set(index)
    // la entidad elegida era de la vista anterior: el inspector no debe sobrevivir al salto
    this._resource.set(null)
    this._field.set(null)
  }

  selectResource(resource: string | null): void {
    if (resource !== this._resource()) this._field.set(null)
    this._resource.set(resource)
  }

  /** Elegir columna arrastra a su entidad: el inspector necesita las dos. */
  selectField(resource: string, field: number | null): void {
    this._resource.set(resource)
    this._field.set(field)
  }
}
