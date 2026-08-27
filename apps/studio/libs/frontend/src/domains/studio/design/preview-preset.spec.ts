import { describe, expect, it } from 'vitest'
import { DESIGN_PRESETS } from '@raptor/schema'
import { PREVIEW_PRESETS } from './preview-settings'
import { presetCanvasCss, presetTokenVars } from './preset-canvas-css'

/**
 * Spec 68: el lienzo previsualiza la piel con el CSS REAL del preset, no con una copia.
 *
 * Antes había DOS aproximaciones escritas a mano: `presetChrome()` (tokens de color del shell) y
 * unas 140 líneas de `.preview-scope[data-preset='…']` en el styles.css del estudio. La segunda
 * aplanaba las esquinas listando clases a mano y se dejó fuera `rounded-xl`, que es justo la de
 * la tarjeta KPI: de ahí que los KPIs salieran redondeados mientras el resto se cuadraba.
 *
 * Retiradas las cinco pieles (2026-08-27) queda el neutro, que no tiñe nada. Lo que estos tests
 * sostienen es la COSTURA: el lienzo ofrece los presets del generador y ni uno más, y la piel que
 * no está en el catálogo no pinta nada en vez de reventar el lienzo.
 */
describe('la piel del lienzo', () => {
  it('ofrece exactamente los presets que el generador conoce', () => {
    expect(PREVIEW_PRESETS.map(p => p.id)).toEqual(DESIGN_PRESETS.map(p => p.id))
  })

  it('el neutro no tiñe el lienzo: ni tokens ni CSS', () => {
    expect(presetTokenVars('actual')).toEqual({})
    expect(presetCanvasCss('actual')).toBe('')
  })

  it('una piel que no está en el catálogo no tiñe nada: el lienzo sigue dibujándose', () => {
    // las cinco retiradas entran por aquí si un diseño guardado las trae en su JSON
    for (const gone of ['cabina', 'suite', 'taller', 'banco', 'rotulo']) {
      expect(presetTokenVars(gone)).toEqual({})
      expect(presetCanvasCss(gone)).toBe('')
    }
  })
})
