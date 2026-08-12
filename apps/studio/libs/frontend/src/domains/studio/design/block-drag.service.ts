import { Injectable, signal } from '@angular/core'
import type { BlockKind } from '@app/shared/domain'

/**
 * Qué componente se está arrastrando desde la paleta. Vive fuera de los dos
 * lados del gesto —el panel de componentes lo empieza, el lienzo lo termina—
 * y es también lo que enciende los huecos: sin arrastre, el lienzo no enseña
 * ninguno. El `dataTransfer` del navegador no vale como fuente: durante el
 * `dragover` no deja leer su contenido.
 */
@Injectable({ providedIn: 'root' })
export class BlockDragService {
  private readonly _kind = signal<BlockKind | null>(null)

  readonly kind = this._kind.asReadonly()

  start(kind: BlockKind): void {
    this._kind.set(kind)
  }

  end(): void {
    this._kind.set(null)
  }
}
