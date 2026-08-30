import { describe, expect, it } from 'vitest'
import { THEMES } from '@raptor/schema'
import { PREVIEW_PALETTES, PreviewSettings } from './preview-settings'

/**
 * El selector de paleta del lienzo. Desde el 2026-08-31 la casa se ofrece primero:
 * raptor abre la lista y es la paleta con la que arranca la previsualización, con el
 * naranja de marca #d75f3d como muestra — el negro de tinta salió del selector.
 *
 * El neutro NO se ofrece: es el esqueleto interno del generador (lo que se emite sin
 * tema declarado), no una paleta que se elija. Sigue en el catálogo del schema para
 * que los diseños antiguos y el diff de oro no se muevan.
 */
describe('el selector de paleta', () => {
  it('ofrece raptor como primera opción, con el naranja de marca de muestra', () => {
    expect(PREVIEW_PALETTES[0].id).toBe('raptor')
    expect(PREVIEW_PALETTES[0].label).toBe('Raptor')
    expect(PREVIEW_PALETTES[0].swatch).toBe('oklch(0.63 0.159 36.6)')
  })

  it('no ofrece el neutro: el esqueleto no es una paleta', () => {
    expect(PREVIEW_PALETTES.some(p => p.id === 'neutral')).toBe(false)
  })

  it('ofrece el resto del catálogo tal cual: lo que ves es lo que se genera', () => {
    expect(PREVIEW_PALETTES.map(p => p.id)).toEqual(THEMES.filter(t => t.id !== 'neutral').map(t => t.id))
  })

  it('arranca con raptor seleccionada: es el defecto del estudio', () => {
    expect(new PreviewSettings().palette()).toBe('raptor')
  })
})
