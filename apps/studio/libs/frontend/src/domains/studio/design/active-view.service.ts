import { Injectable, computed, inject, signal } from '@angular/core'
import { DesignStore } from './design-store'

/**
 * Qué vista se está dibujando. Vive fuera del lienzo porque la comparten el
 * panel de vistas y el propio lienzo, y se clampa contra el diseño: borrar la
 * última vista no puede dejar apuntando a un hueco.
 */
@Injectable({ providedIn: 'root' })
export class ActiveViewService {
  private readonly store = inject(DesignStore)
  private readonly _index = signal(0)

  readonly index = computed(() => Math.min(this._index(), Math.max(this.store.pages().length - 1, 0)))

  select(index: number): void {
    this._index.set(index)
  }
}
