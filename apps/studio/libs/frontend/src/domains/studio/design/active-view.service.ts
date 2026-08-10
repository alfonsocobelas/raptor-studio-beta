import { Injectable, computed, inject, signal } from '@angular/core'
import { DesignStore } from './design-store'

/**
 * Qué se está editando: la vista dibujada y la entidad elegida dentro de ella.
 * Vive fuera del lienzo porque lo comparten el panel de vistas, el lienzo y el
 * inspector, y el índice se clampa contra el diseño: borrar la última vista no
 * puede dejar apuntando a un hueco.
 */
@Injectable({ providedIn: 'root' })
export class ActiveViewService {
  private readonly store = inject(DesignStore)
  private readonly _index = signal(0)
  private readonly _resource = signal<string | null>(null)

  readonly index = computed(() => Math.min(this._index(), Math.max(this.store.pages().length - 1, 0)))

  /** Entidad cuyo detalle enseña el inspector; null cuando no hay nada elegido. */
  readonly resource = this._resource.asReadonly()

  select(index: number): void {
    this._index.set(index)
    // la entidad elegida era de la vista anterior: el inspector no debe sobrevivir al salto
    this._resource.set(null)
  }

  selectResource(resource: string | null): void {
    this._resource.set(resource)
  }
}
