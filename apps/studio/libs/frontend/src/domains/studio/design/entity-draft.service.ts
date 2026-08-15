import { Injectable, signal } from '@angular/core'
import type { NodePosition } from '@app/shared/domain'

/**
 * El alta de entidad en curso. La pide el raíl (o la tecla E) y la atiende el
 * lienzo: la caja se dibuja donde va a vivir y se nombra encima. Mientras dura,
 * la entidad NO existe en el diseño —es un fantasma— así que cancelar no borra
 * nada y no hace falta renombrar después.
 */
@Injectable({ providedIn: 'root' })
export class EntityDraftService {
  private readonly _pending = signal(false)
  private readonly _at = signal<NodePosition | null>(null)

  readonly pending = this._pending.asReadonly()

  /** Dónde se picó, en coordenadas del mundo. Sin posición, la caja va al hueco de la retícula. */
  readonly at = this._at.asReadonly()

  start(at?: NodePosition): void {
    this._at.set(at ?? null)
    this._pending.set(true)
  }

  cancel(): void {
    this._pending.set(false)
    this._at.set(null)
  }
}
