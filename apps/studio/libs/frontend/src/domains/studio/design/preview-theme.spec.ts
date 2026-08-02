import { describe, expect, it } from 'vitest'
import { THEMES, deriveTheme, findTheme } from '@acc/schema'
import { previewThemeVars } from './preview-theme'

describe('previewThemeVars — el lienzo pinta con los tokens que se van a emitir', () => {
  it('devuelve los 26 tokens como propiedades personalizadas', () => {
    // GIVEN el tema por defecto
    // WHEN se piden sus variables en claro
    const vars = previewThemeVars('neutral', 'light')

    // THEN son propiedades CSS, no clases ni nombres sueltos
    expect(Object.keys(vars)).toHaveLength(26)
    for (const name of Object.keys(vars)) {
      expect(name.startsWith('--')).toBe(true)
    }
  })

  it('el neutro del lienzo es el neutro que emite el generador', () => {
    // GIVEN el tema por defecto
    // WHEN se piden sus variables en claro
    const vars = previewThemeVars('neutral', 'light')

    // THEN son las del esqueleto, no una aproximación escrita a mano
    expect(vars['--background']).toBe('oklch(1 0 0)')
    expect(vars['--primary']).toBe('oklch(0.205 0 0)')
    expect(vars['--ring']).toBe('oklch(0.708 0 0)')
  })

  it('en oscuro usa el velo de blanco de los bordes, como la app emitida', () => {
    // GIVEN el tema por defecto
    // WHEN se piden sus variables en oscuro
    const vars = previewThemeVars('neutral', 'dark')

    // THEN el borde es el velo, no un gris inventado
    expect(vars['--background']).toBe('oklch(0.145 0 0)')
    expect(vars['--border']).toBe('oklch(1 0 0 / 10%)')
  })

  it('un tema con color tiñe también las superficies del lienzo', () => {
    // GIVEN un tema del catálogo
    // WHEN se piden sus variables en claro
    const vars = previewThemeVars('ocean', 'light')

    // THEN el fondo dibujado lleva el tono, igual que el emitido
    expect(vars['--background']).toBe('oklch(0.965 0.016 236)')
    expect(vars['--muted']).toBe('oklch(0.93 0.016 236)')
    // tarjeta blanca sobre página teñida: sin ese escalón el lienzo es una mancha plana
    expect(vars['--card']).toBe('oklch(1 0 0)')
    expect(vars['--background']).not.toBe(vars['--card'])
  })

  it('ningún tema del catálogo se aparta de lo que se emitirá', () => {
    // GIVEN todos los temas, en los dos modos
    // WHEN se comparan las variables del lienzo con las derivadas
    // THEN coinciden token a token: si esto se rompe, el lienzo vuelve a mentir
    for (const theme of THEMES) {
      const tokens = deriveTheme(theme)
      for (const mode of ['light', 'dark'] as const) {
        const vars = previewThemeVars(theme.id, mode)
        for (const [name, value] of Object.entries(tokens[mode])) {
          expect(vars[`--${name}`]).toBe(value)
        }
      }
    }
  })

  it('un tema desconocido se dibuja neutro en vez de dejar el lienzo en blanco', () => {
    // GIVEN un id fuera del catálogo
    // WHEN se piden sus variables
    const vars = previewThemeVars('fucsia-flúor', 'light')

    // THEN el lienzo sigue dibujándose
    expect(vars).toEqual(previewThemeVars('neutral', 'light'))
    expect(findTheme('fucsia-flúor')).toBeUndefined()
  })
})
