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

  // La densidad y el vestido de componentes NO viajan por aquí: viven en el styles.css global
  // del estudio con ámbito [data-preset] — mismo mecanismo que la app emitida (2026-08-10).
  it('cabina aporta los tokens del shell a contraste, réplica de los del generador', () => {
    const chrome = presetChrome('cabina', 'light')

    expect(chrome['--preview-shell-bg']).toBeDefined()
    expect(chrome['--preview-shell-fg-strong']).toBeDefined()
    expect(chrome['--preview-shell-active']).toBeDefined()
  })

  it('cabina en oscuro replica los tokens .dark del preset emitido, no los del claro', () => {
    const light = presetChrome('cabina', 'light')
    const dark = presetChrome('cabina', 'dark')

    // el shell real pasa de gris azulado claro (0.97) a casi negro (0.17): visto en e2e-29
    expect(dark['--preview-shell-bg']).toBe('oklch(0.17 0.012 240)')
    expect(dark['--preview-shell-bg']).not.toBe(light['--preview-shell-bg'])
    expect(dark['--preview-shell-fg-strong']).not.toBe(light['--preview-shell-fg-strong'])
  })

  it('suite aporta los tokens de la banda de marca y la rejilla', () => {
    const chrome = presetChrome('suite', 'light')

    expect(chrome['--preview-banner-bg']).toBeDefined()
    expect(chrome['--preview-grid-head']).toBeDefined()
  })

  it('suite en oscuro atenúa banda y rejilla como el bloque .dark del generador', () => {
    const dark = presetChrome('suite', 'dark')

    expect(dark['--preview-banner-bg']).toBe('oklch(0.24 0.05 250)')
    expect(dark['--preview-grid-head']).toBe('oklch(0.26 0.016 250)')
  })
})
