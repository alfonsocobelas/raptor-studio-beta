import { deriveTheme } from './derive-theme'
import { findTheme, resolveThemeId, THEME_IDS, THEMES } from './themes'
import { insideSrgb, isSurfaceToken } from './testing/srgb'

const NEUTRAL_WHITE = 'oklch(1 0 0)'

describe('theme catalog', () => {
  it('is closed and has no duplicated ids', () => {
    // GIVEN el catálogo
    // WHEN se recogen sus ids
    const ids = THEMES.map(t => t.id)

    // THEN no hay repetidos y THEME_IDS los refleja
    expect(new Set(ids).size).toBe(ids.length)
    expect(THEME_IDS).toEqual(ids)
  })

  it('every theme has a label to show in the studio', () => {
    // GIVEN el catálogo
    // WHEN se revisa cada tema
    // THEN todos se pueden nombrar en el selector
    for (const theme of THEMES) {
      expect(theme.label.trim().length).toBeGreaterThan(0)
    }
  })

  it('every theme derives the same complete token set', () => {
    // GIVEN el tema neutro como referencia del juego de tokens
    const reference = deriveTheme(findTheme('neutral')!)
    const keys = Object.keys(reference.light).sort()

    // WHEN se derivan todos los temas
    // THEN ninguno se deja un token por el camino, ni en claro ni en oscuro
    for (const theme of THEMES) {
      const tokens = deriveTheme(theme)
      expect(Object.keys(tokens.light).sort()).toEqual(keys)
      expect(Object.keys(tokens.dark).sort()).toEqual(keys)
    }
  })

  describe('neutral', () => {
    it('is in the catalog and leaves the surfaces untouched', () => {
      // GIVEN el tema neutro del catálogo
      const neutral = findTheme('neutral')

      // WHEN se deriva
      const tokens = deriveTheme(neutral!)

      // THEN sigue siendo el esqueleto: blanco puro, sin tono
      expect(tokens.light['background']).toBe(NEUTRAL_WHITE)
      expect(tokens.light['card']).toBe(NEUTRAL_WHITE)
      expect(tokens.light['border']).toBe('oklch(0.922 0 0)')
      expect(tokens.dark['background']).toBe('oklch(0.21 0 0)')
    })
  })

  describe('every other theme', () => {
    const coloured = () => THEMES.filter(t => t.id !== 'neutral')

    it('dresses the surfaces, not just the action', () => {
      // GIVEN los temas con color
      // WHEN se derivan
      // THEN su fondo NO es el blanco del neutro: es lo que la spec 18 no hacía
      for (const theme of coloured()) {
        const tokens = deriveTheme(theme)
        expect(tokens.light['background']).not.toBe(NEUTRAL_WHITE)
        expect(tokens.light['muted']).not.toBe('oklch(0.97 0 0)')
        expect(tokens.dark['card']).not.toBe('oklch(0.205 0 0)')
      }
    })

    it('lifts the cards off the page instead of painting both the same', () => {
      // GIVEN los temas con color
      // WHEN se comparan página y tarjeta
      // THEN no coinciden: sin ese escalón la pantalla es una mancha plana
      for (const theme of coloured()) {
        const { light } = deriveTheme(theme)
        expect(light['background']).not.toBe(light['card'])
      }
    })

    it('tints the page enough to be seen, not by a rounding error', () => {
      // GIVEN los temas con color
      // WHEN se mira la luminancia de su fondo claro
      // THEN está donde el gamut sRGB admite croma: por encima de 0.97 no cabe
      for (const theme of coloured()) {
        expect(theme.surface.ramp?.page).toBeLessThanOrEqual(0.97)
      }
    })

    it('keeps every token inside sRGB, or the tint is silently lost', () => {
      // GIVEN todos los temas del catálogo
      // WHEN se convierte cada token a sRGB
      // THEN ninguno se recorta: un token recortado se dibuja neutro y el tema
      // se ve gris por mucho croma que declare
      for (const theme of THEMES) {
        const tokens = deriveTheme(theme)
        for (const [name, value] of [...Object.entries(tokens.light), ...Object.entries(tokens.dark)]) {
          if (!isSurfaceToken(name)) continue
          expect({ theme: theme.id, name, value, inside: insideSrgb(value) }).toMatchObject({ inside: true })
        }
      }
    })
  })

  describe('findTheme', () => {
    it('returns undefined for an id outside the catalog', () => {
      // GIVEN un id que nadie declaró
      // WHEN se busca
      // THEN no hay tema, y quien llame decide qué hacer
      expect(findTheme('chartreuse')).toBeUndefined()
    })
  })

  describe('resolveThemeId', () => {
    it('defaults to neutral when no theme is declared', () => {
      // GIVEN una app sin tema
      // WHEN se resuelve
      // THEN es neutro: lo que se emite hoy
      expect(resolveThemeId(undefined)).toBe('neutral')
      expect(resolveThemeId({})).toBe('neutral')
    })

    it('reads the new id', () => {
      // GIVEN una app con tema declarado
      // WHEN se resuelve
      // THEN gana el id
      expect(resolveThemeId({ id: 'ocean' })).toBe('ocean')
    })

    it('still reads the palette alias of spec 18', () => {
      // GIVEN una app generada antes de la spec 20
      // WHEN se resuelve
      // THEN el alias sigue valiendo: no se invalida lo ya generado
      expect(resolveThemeId({ palette: 'ocean' })).toBe('ocean')
    })

    it('prefers the id over the alias when both are present', () => {
      // GIVEN una app con los dos campos
      // WHEN se resuelve
      // THEN manda el nombre nuevo
      expect(resolveThemeId({ id: 'forest', palette: 'ocean' })).toBe('forest')
    })
  })
})
