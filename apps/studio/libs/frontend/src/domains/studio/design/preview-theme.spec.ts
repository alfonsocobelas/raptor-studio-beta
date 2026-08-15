import { describe, expect, it, vi } from 'vitest'
import * as schema from '@raptor/schema'
import { THEMES, deriveTheme, findTheme } from '@raptor/schema'
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

    // THEN la página es el gris carbón que emite el generador (no el negro de antes)
    // y el borde es el velo, no un gris inventado
    expect(vars['--background']).toBe('oklch(0.21 0 0)')
    expect(vars['--border']).toBe('oklch(1 0 0 / 10%)')
    // la tarjeta queda por encima de la página: sin ese escalón el lienzo es una mancha
    expect(vars['--card']).toBe('oklch(0.26 0 0)')
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

  it('un tema sin radio declarado NO pisa el radio del lienzo (la piel material redondea más)', () => {
    // GIVEN el neutro, que no declara radio
    // WHEN se piden sus variables
    const vars = previewThemeVars('neutral', 'light')

    // THEN no hay --radius inline: mandan las reglas de la piel del preview-scope
    expect(vars['--radius']).toBeUndefined()
  })

  it('un tema CON radio declarado lo lleva al lienzo', () => {
    // GIVEN un tema del catálogo al que se le fija un radio
    const theme = findTheme('ocean')
    if (!theme) throw new Error('ocean no está en el catálogo')
    const original = theme.radius
    theme.radius = '0.25rem'

    try {
      // WHEN se piden sus variables
      const vars = previewThemeVars('ocean', 'light')

      // THEN el lienzo redondea exactamente lo que la app emitirá
      expect(vars['--radius']).toBe('0.25rem')
    } finally {
      theme.radius = original
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

/** Fase 3 (spec 20): el lienzo antepone la fuente del tema, como hará el styles.css emitido. */
describe('la fuente del tema en el lienzo', () => {
  it('un tema sin fuente no pisa la pila del preview', () => {
    const vars = previewThemeVars('neutral', 'light')

    expect(vars['--font-sans']).toBeUndefined()
  })

  it('un tema con fuente la antepone, con la pila del preview de respaldo', () => {
    const themed = findTheme('hydrangea')
    if (!themed) throw new Error('falta hydrangea en el catálogo')
    const spy = vi
      .spyOn(schema, 'findTheme')
      .mockReturnValue({ ...themed, font: { family: 'Inter Variable', package: '@fontsource-variable/inter' } })

    try {
      const vars = previewThemeVars('hydrangea', 'light')
      expect(vars['--font-sans']).toBe(`'Inter Variable', var(--font-sans)`)
    } finally {
      spy.mockRestore()
    }
  })
})
