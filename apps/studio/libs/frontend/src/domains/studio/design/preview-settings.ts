import { Injectable, signal } from '@angular/core'

export type PreviewTheme = 'light' | 'dark'
export type PreviewSkin = 'spartan' | 'material'

export interface PreviewPalette {
  id: string
  label: string
  /** Muestra para el selector */
  swatch: string
}

/** Paletas de previsualización: solo afectan a la app dibujada, nunca al estudio. */
export const PREVIEW_PALETTES: PreviewPalette[] = [
  { id: 'neutral', label: 'Neutro', swatch: 'oklch(0.25 0 0)' },
  { id: 'hydrangea', label: 'Hortensia', swatch: 'oklch(0.53 0.16 285)' },
  { id: 'ocean', label: 'Océano', swatch: 'oklch(0.55 0.14 235)' },
  { id: 'forest', label: 'Bosque', swatch: 'oklch(0.52 0.13 155)' },
  { id: 'amber', label: 'Ámbar', swatch: 'oklch(0.62 0.15 65)' },
  { id: 'rose', label: 'Rosa', swatch: 'oklch(0.56 0.17 15)' }
]

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
