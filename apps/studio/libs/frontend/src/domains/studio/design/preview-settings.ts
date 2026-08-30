import { Injectable, signal } from '@angular/core'
import { THEMES } from '@raptor/schema'

export type PreviewTheme = 'light' | 'dark'

/** Los presets visuales que conoce el generador (ranura `design`). */
export type PreviewPreset = 'actual'

export interface PresetOption {
  id: PreviewPreset
  label: string
}

/**
 * El selector ofrece los mismos presets que la ranura `design` del generador — hoy uno solo, el
 * neutro: las cinco pieles se retiraron el 2026-08-27. El selector se queda porque es la costura
 * por la que entra la siguiente, y su test lo ata a `DESIGN_PRESETS` para que no derive.
 */
export const PREVIEW_PRESETS: PresetOption[] = [{ id: 'actual', label: 'Actual (neutro)' }]

export interface PreviewPalette {
  id: string
  label: string
  /** Muestra para el selector */
  swatch: string
}

/**
 * Los temas del selector SON los del catálogo del schema: si el lienzo
 * ofreciera uno que el generador no conoce, lo que ves no sería lo que se
 * genera. Solo afectan a la app dibujada, nunca al chrome del estudio.
 *
 * El neutro no se ofrece (2026-08-31): es el esqueleto interno del generador
 * —lo que se emite cuando la app no declara tema—, no una paleta elegible.
 */
export const PREVIEW_PALETTES: PreviewPalette[] = THEMES.filter(t => t.id !== 'neutral').map(t => ({
  id: t.id,
  label: t.label,
  swatch: t.light.primary
}))

/**
 * Ajustes de PREVISUALIZACIÓN de la app en el lienzo (tema, paleta y piel).
 * Son independientes del tema del propio estudio: el estudio puede estar en
 * oscuro y la app dibujarse en claro, y al revés.
 */
@Injectable({ providedIn: 'root' })
export class PreviewSettings {
  readonly theme = signal<PreviewTheme>('light')
  /** La casa por defecto (2026-08-31): raptor abre el selector y arranca seleccionada. */
  readonly palette = signal<string>('raptor')
  /** Preset visual de la app dibujada; viaja al wizard como valor por defecto de la ranura. */
  readonly preset = signal<PreviewPreset>('actual')

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
