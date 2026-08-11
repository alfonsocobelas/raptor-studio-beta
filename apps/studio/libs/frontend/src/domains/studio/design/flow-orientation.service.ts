import { Injectable, signal } from '@angular/core'
import type { FlowOrientation } from '@app/shared/domain'

/**
 * Cómo se lee el proceso: en fila o en columna. Es cosmético como el layout y la
 * cámara —el diseño guarda nodos y aristas, nunca su disposición—, así que vive en
 * memoria de la sesión.
 */
@Injectable({ providedIn: 'root' })
export class FlowOrientationService {
  private readonly _value = signal<FlowOrientation>('horizontal')
  readonly value = this._value.asReadonly()

  toggle(): void {
    this._value.update(current => (current === 'horizontal' ? 'vertical' : 'horizontal'))
  }
}
