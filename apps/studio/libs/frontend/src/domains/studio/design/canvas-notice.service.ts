import { Injectable, signal } from '@angular/core'

/** Un aviso del lienzo: lo que ha pasado y, si el usuario quiere seguirlo, adónde ir. */
export interface CanvasNotice {
  text: string
  action?: { label: string; run: () => void }
}

/**
 * Lo que el lienzo tiene que decir en voz alta. Nació porque los gestos podían
 * fracasar en silencio —el gate revierte una mutación, un bloque de ficha se va
 * a otra pantalla— y el único rastro era un rótulo diminuto en la cabecera: se
 * leía como «el estudio me ha borrado la tabla».
 *
 * No se cierra solo: un aviso que se desvanece antes de leerlo no es un aviso.
 * Lo tapa el siguiente gesto o lo cierra quien lo lee.
 */
@Injectable({ providedIn: 'root' })
export class CanvasNoticeService {
  private readonly _notice = signal<CanvasNotice | null>(null)

  readonly notice = this._notice.asReadonly()

  show(text: string, action?: CanvasNotice['action']): void {
    this._notice.set({ text, ...(action ? { action } : {}) })
  }

  dismiss(): void {
    this._notice.set(null)
  }
}
