import { DESIGN_PRESETS } from '@raptor/schema'
import { Injectable, effect, inject } from '@angular/core'
import { PreviewSettings } from './preview-settings'
import { scopePresetCss } from './scope-preset-css'

/** El nodo del lienzo que hace de «app»: su clase es el ámbito de todo lo que viste la piel. */
export const CANVAS_SCOPE = '.preview-scope'

/**
 * La piel del lienzo, con el CSS REAL del preset (spec 68).
 *
 * Antes había dos copias escritas a mano: `presetChrome()` con los tokens de color del shell, y
 * unas 140 líneas de `.preview-scope[data-preset='…']` en el styles.css del estudio. La segunda
 * aplanaba esquinas listando clases a mano (`.rounded-full`, `.rounded-md`, `.rounded-lg`,
 * `.rounded`) y se dejó fuera `rounded-xl` — la de la tarjeta KPI. Resultado: los KPIs salían
 * redondeados bajo cabina y suite mientras el resto se cuadraba, y la conclusión razonable al
 * verlo era que la piel no se aplicaba.
 *
 * Ahora la verdad es una: `DESIGN_PRESETS` en `@raptor/schema`, igual que los temas.
 */
export function presetCanvasCss(presetId: string): string {
  const preset = DESIGN_PRESETS.find(candidate => candidate.id === presetId)
  if (!preset?.css) return ''
  return scopePresetCss(preset.css, CANVAS_SCOPE)
}

/**
 * Los tokens que el preset le PISA al tema (los radios, hoy). Van inline sobre el lienzo, no en
 * la hoja de estilos, porque el lienzo pinta los tokens del tema con `[style]` y el estilo
 * inline gana a cualquier regla: en una hoja se quedarían debajo.
 */
export function presetTokenVars(presetId: string): Record<string, string> {
  const preset = DESIGN_PRESETS.find(candidate => candidate.id === presetId)
  if (!preset?.tokens) return {}

  return Object.fromEntries(
    preset.tokens
      .split('\n')
      .map(line => line.replace(/\/\*[\s\S]*?\*\//g, '').trim())
      .filter(line => line.startsWith('--') && line.includes(':'))
      .map(line => {
        const separator = line.indexOf(':')
        return [
          line.slice(0, separator).trim(),
          line
            .slice(separator + 1)
            .replace(/;$/, '')
            .trim()
        ]
      })
  )
}

/**
 * Mantiene en el documento la hoja de la piel elegida. Es un `<style>` porque el CSS del preset
 * son REGLAS (no sólo variables) y las reglas no caben en un `[style]` inline.
 */
@Injectable({ providedIn: 'root' })
export class PresetCanvasCssService {
  private readonly _preview = inject(PreviewSettings)
  private _element: HTMLStyleElement | null = null

  constructor() {
    effect(() => {
      this.apply(presetCanvasCss(this._preview.preset()))
    })
  }

  private apply(css: string): void {
    if (typeof document === 'undefined') return
    if (!this._element) {
      this._element = document.createElement('style')
      this._element.setAttribute('data-testid', 'preset-canvas-css')
      document.head.appendChild(this._element)
    }
    this._element.textContent = css
  }
}
