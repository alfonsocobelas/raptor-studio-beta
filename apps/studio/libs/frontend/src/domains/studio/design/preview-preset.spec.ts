import { describe, expect, it } from 'vitest'
import { DESIGN_PRESETS } from '@raptor/schema'
import { PREVIEW_PRESETS } from './preview-settings'
import { presetCanvasCss, presetTokenVars } from './preset-canvas-css'

/**
 * Spec 68: el lienzo previsualiza la piel con el CSS REAL del preset, no con una copia.
 *
 * Antes había DOS aproximaciones escritas a mano: `presetChrome()` (tokens de color del shell) y
 * unas 140 líneas de `.preview-scope[data-preset='…']` en el styles.css del estudio. La segunda
 * aplanaba las esquinas listando clases a mano — `.rounded-full`, `.rounded-md`, `.rounded-lg`,
 * `.rounded` — y se dejó fuera `rounded-xl`, que es justo la de la tarjeta KPI: de ahí que los
 * KPIs salieran redondeados bajo cabina y suite mientras el resto se cuadraba.
 */
describe('la piel del lienzo', () => {
  it('ofrece exactamente los presets que el generador conoce', () => {
    expect(PREVIEW_PRESETS.map(p => p.id)).toEqual(DESIGN_PRESETS.map(p => p.id))
  })

  it('el neutro no tiñe el lienzo: ni tokens ni CSS', () => {
    expect(presetTokenVars('actual')).toEqual({})
    expect(presetCanvasCss('actual')).toBe('')
  })

  it('los tokens que el preset pisa del tema viajan INLINE, que es lo que gana al tema del lienzo', () => {
    // el lienzo pinta los tokens del tema con [style]; una regla de hoja de estilos perdería
    expect(presetTokenVars('cabina')['--radius']).toBe('0px')
    expect(presetTokenVars('cabina')['--radius-xl']).toBe('0px')
    expect(presetTokenVars('suite')['--radius']).toBe('2px')
  })

  it('el CSS del preset llega acotado al lienzo, con sus tokens propios y sus reglas', () => {
    const css = presetCanvasCss('cabina')

    expect(css).toContain('.preview-scope {')
    expect(css).toContain('--shell-bg')
    // las reglas de bloque, que es lo que la aproximación no tenía
    expect(css).toContain('.preview-scope .app-panel')
    expect(css).not.toContain(':root')
    expect(css).not.toContain('.app-shell-main')
  })

  it('el modo oscuro del preset se pega al lienzo, no al documento', () => {
    expect(presetCanvasCss('cabina')).toContain('.preview-scope.dark')
  })

  it('suite trae la rejilla y la banda con sus nombres reales, no con alias de previsualización', () => {
    const css = presetCanvasCss('suite')

    expect(css).toContain('--grid-line')
    expect(css).toContain('--banner-bg')
    expect(css).not.toContain('--preview-')
  })
})
