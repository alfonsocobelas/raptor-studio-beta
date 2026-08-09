import { describe, expect, it } from 'vitest'
import { PREVIEW_PRESETS, presetChrome } from './preview-settings'

/**
 * Spec 37 en el estudio: el lienzo alternaba spartan/material — una aproximación de 12 líneas
 * de CSS que NO decía nada de la app generada (medido: las dos pieles emiten apps
 * indistinguibles). Ahora previsualiza el preset visual, que es lo que sí cambia el shell.
 */
describe('presets del lienzo', () => {
  it('ofrece exactamente los presets que el generador conoce', () => {
    expect(PREVIEW_PRESETS.map(p => p.id)).toEqual(['actual', 'cabina', 'suite'])
  })

  it('el neutro no tiñe el lienzo: es el shell de siempre', () => {
    expect(presetChrome('actual')).toEqual({})
  })

  it('cabina viste la barra lateral a contraste y aprieta la fila', () => {
    const chrome = presetChrome('cabina')

    expect(chrome['--preview-shell-bg']).toBeDefined()
    expect(chrome['--preview-row-py']).toBeDefined()
  })

  it('suite sube la navegación a una banda de marca', () => {
    const chrome = presetChrome('suite')

    expect(chrome['--preview-banner-bg']).toBeDefined()
  })
})
