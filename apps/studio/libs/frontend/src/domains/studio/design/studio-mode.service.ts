import { Injectable, signal } from '@angular/core'
import type { StudioMode } from './studio-modes'

/**
 * En qué modo está el estudio. Vive fuera del lienzo porque no solo lo pinta la
 * barra: el chat cambia lo que sugiere según lo que estés mirando, y el panel
 * derecho cambia de pestañas.
 */
@Injectable({ providedIn: 'root' })
export class StudioModeService {
  readonly mode = signal<StudioMode>('views')
}
