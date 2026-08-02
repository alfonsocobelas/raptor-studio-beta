import { Injectable, signal } from '@angular/core'
import { PALETTES } from '@acc/schema'

export type PreviewTheme = 'light' | 'dark'
export type PreviewSkin = 'spartan' | 'material'

export interface PreviewPalette {
  id: string
  label: string
  /** Muestra para el selector */
  swatch: string
}

/**
 * Las paletas del selector SON las del catálogo del schema: si el lienzo
 * ofreciera una que el generador no conoce, lo que ves no sería lo que se
 * genera. Solo afectan a la app dibujada, nunca al chrome del estudio.
 */
export const PREVIEW_PALETTES: PreviewPalette[] = PALETTES.map(p => ({
  id: p.id,
  label: p.label,
  swatch: p.light.primary
}))

/**
 * Ajustes de PREVISUALIZACIÓN de la app en el lienzo (tema, paleta y piel).
 * Son independientes del tema del propio estudio: el estudio puede estar en
 * oscuro y la app dibujarse en claro, y al revés.
 */
@Injectable({ providedIn: 'root' })
export class PreviewSettings {
  readonly theme = signal<PreviewTheme>('light')
  readonly palette = signal<string>('neutral')
  readonly skin = signal<PreviewSkin>('spartan')

  /** Tema del ESTUDIO (chrome), separado del de la app previsualizada. */
  readonly studioTheme = signal<PreviewTheme>('light')

  toggleStudioTheme(): void {
    const next = this.studioTheme() === 'light' ? 'dark' : 'light'
    this.studioTheme.set(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  toggleTheme(): void {
    this.theme.update(t => (t === 'light' ? 'dark' : 'light'))
  }
}
