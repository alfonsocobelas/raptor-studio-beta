import { Injectable, signal } from '@angular/core'
import { THEMES } from '@acc/schema'

export type PreviewTheme = 'light' | 'dark'

/** Los presets visuales que conoce el generador (ranura `design`). */
export type PreviewPreset = 'actual' | 'cabina' | 'suite'

export interface PresetOption {
  id: PreviewPreset
  label: string
}

/**
 * El selector ofrece los mismos presets que la ranura `design` del generador. Antes aquí se
 * alternaba spartan/material, que era una aproximación de 12 líneas de CSS y no decía nada de
 * la app emitida: medido el 2026-08-09, las dos librerías producen apps indistinguibles.
 * Lo que sí cambia el shell es el preset, así que es lo que se previsualiza.
 */
export const PREVIEW_PRESETS: PresetOption[] = [
  { id: 'actual', label: 'Actual (neutro)' },
  { id: 'cabina', label: 'Cabina (operaciones)' },
  { id: 'suite', label: 'Suite (ERP)' }
]

/**
 * Cromo de previsualización del preset, como variables CSS que el lienzo aplica sobre su
 * ámbito. Es una APROXIMACIÓN declarada: el shell real lo emite el generador. Se mantiene
 * deliberadamente corto — su trabajo es que se reconozca el preset, no clonarlo.
 */
export function presetChrome(preset: PreviewPreset): Record<string, string> {
  if (preset === 'cabina') {
    return {
      '--preview-shell-bg': 'oklch(0.97 0.004 240)',
      '--preview-shell-fg': 'oklch(0.42 0.02 240)',
      '--preview-shell-border': 'oklch(0.9 0.008 240)',
      '--preview-row-py': '0.3rem',
      '--preview-head-transform': 'uppercase'
    }
  }
  if (preset === 'suite') {
    return {
      '--preview-banner-bg': 'oklch(0.32 0.07 250)',
      '--preview-banner-fg': 'oklch(0.98 0.005 250)',
      '--preview-grid-line': 'oklch(0.86 0.012 250)',
      '--preview-row-py': '0.4rem',
      '--preview-head-transform': 'none'
    }
  }
  return {}
}

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
 */
export const PREVIEW_PALETTES: PreviewPalette[] = THEMES.map(t => ({
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
  readonly palette = signal<string>('neutral')
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
