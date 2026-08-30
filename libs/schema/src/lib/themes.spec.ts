import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { deriveTheme, TOKEN_ORDER } from './derive-theme'
import { findTheme, resolveThemeId, THEME_IDS, THEMES } from './themes'
import { insideSrgb, isSurfaceToken } from './testing/srgb'

const NEUTRAL_WHITE = 'oklch(1 0 0)'

describe('theme catalog', () => {
  it('is closed and has no duplicated ids', () => {
    // GIVEN el catálogo
    // WHEN se recogen sus ids
    const ids = THEMES.map(t => t.id)

    // THEN es exactamente este (ámbar se retiró el 2026-08-31) y THEME_IDS lo refleja
    expect(ids).toEqual(['raptor', 'neutral', 'hydrangea', 'ocean', 'forest', 'rose'])
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

    it('tints the page, and the tint survives sRGB', () => {
      // GIVEN los temas con color
      // WHEN se deriva su fondo claro
      // THEN lleva croma Y cabe en sRGB — un token recortado se dibuja neutro
      //
      // Antes esto se comprobaba con un techo de luminancia (`ramp.page <= 0.97`), que era un
      // PROXY: por encima de ahí casi no cabe croma. «Raptor» lo rompe legítimamente —papel a
      // 0.985 con croma 0.003, que es lo que sirve el estudio y cabe de sobra—, así que el
      // invariante se afirma directamente en vez de por su proxy (spec 69).
      for (const theme of coloured()) {
        const page = deriveTheme(theme).light['background']
        const chroma = Number(page.match(/oklch\([\d.]+ ([\d.]+)/)?.[1])
        expect({ theme: theme.id, chroma, inside: insideSrgb(page) }).toMatchObject({ inside: true })
        expect(chroma).toBeGreaterThan(0)
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

/**
 * El tema «raptor» (spec 69): la paleta que viste al PROPIO estudio, bajada al emitido.
 *
 * El test no copia los valores: LEE el `styles.css` del estudio y compara token a token. Si
 * mañana se recalibra la paleta de la casa y nadie baja el cambio al catálogo, esto lo canta —
 * que es exactamente el desfase que la spec quiere evitar.
 */
describe('raptor: la paleta de la casa', () => {
  const STUDIO_STYLES = join(__dirname, '../../../../apps/studio/apps/frontend-app/src/styles.css')

  /**
   * Los tokens de un bloque `{ … }` del styles.css del estudio, filtrados a los que el
   * derivador emite (el estudio declara además --brand, --font-sans, --radius* y sus --studio-*).
   */
  const studioBlock = (selector: string): Record<string, string> => {
    const css = readFileSync(STUDIO_STYLES, 'utf-8')
    const start = css.indexOf(`${selector} {`)
    expect(start).toBeGreaterThan(-1)
    const block = css.slice(start, css.indexOf('\n}', start))

    const tokens: Record<string, string> = {}
    for (const [, name, value] of block.matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
      if (TOKEN_ORDER.includes(name)) tokens[name] = value.trim()
    }
    return tokens
  }

  /**
   * Desviaciones deliberadas respecto al chrome del estudio.
   *
   * `--sidebar` sale del escalón `subtle`, que el derivador comparte con el `--foreground` del
   * modo oscuro: ponerlo en blanco puro (como el estudio) dejaría el texto de la app oscura en
   * blanco puro, más duro que el papel del estudio. Se queda en el papel cálido, y no lo ve
   * nadie: ninguna plantilla del emitido consume --sidebar ni `bg-sidebar` (comprobado el
   * 2026-08-27); el aside pinta con `bg-card`.
   *
   * El CTA (primary y sidebar-primary, con sus foreground) se desvió el 2026-08-31: el estudio
   * sigue con el CTA en tinta, pero el tema del catálogo lo lleva en el naranja de marca
   * #d75f3d — el negro fuera de la paleta que ofrece el selector.
   */
  const DEVIATIONS = ['sidebar', 'primary', 'primary-foreground', 'sidebar-primary', 'sidebar-primary-foreground']

  const compare = (mode: 'light' | 'dark', selector: string) => {
    const raptor = findTheme('raptor')
    expect(raptor).toBeDefined()
    const derived = deriveTheme(raptor!)[mode]
    const studio = studioBlock(selector)

    // el bloque del estudio tiene que traer el juego completo, o el test se estaría auto-aprobando
    expect(Object.keys(studio).length).toBe(TOKEN_ORDER.length)

    for (const [token, value] of Object.entries(studio)) {
      if (DEVIATIONS.includes(token)) continue
      expect(`${token}: ${derived[token]}`).toBe(`${token}: ${value}`)
    }
  }

  it('is in the catalog with a label for the studio selector', () => {
    // GIVEN el catálogo
    // WHEN se busca raptor
    const raptor = findTheme('raptor')

    // THEN existe y se puede nombrar, sin coletilla
    expect(raptor?.label).toBe('Raptor')
  })

  it('opens the catalog: first of the list, the default the studio offers', () => {
    // GIVEN el catálogo
    // WHEN se mira el primer tema
    // THEN es raptor: el selector del estudio lo ofrece como primera opción
    expect(THEMES[0].id).toBe('raptor')
  })

  it('reproduces the studio light block token for token', () => {
    compare('light', ':root .theme-neutral')
  })

  it('reproduces the studio dark block token for token', () => {
    compare('dark', ':root.dark .theme-neutral')
  })

  it('keeps the card white over the warm paper: that is what gives it relief', () => {
    // GIVEN el tema raptor
    // WHEN se deriva
    const tokens = deriveTheme(findTheme('raptor')!)

    // THEN la tarjeta es blanca y la página lleva el tono cálido
    expect(tokens.light['card']).toBe('oklch(1 0 0)')
    expect(tokens.light['background']).toBe('oklch(0.985 0.003 85)')
  })

  it('puts the brand orange on the CTA: no ink-black button in the palette', () => {
    // GIVEN el tema raptor
    // WHEN se deriva
    const tokens = deriveTheme(findTheme('raptor')!)

    // THEN el CTA es el naranja de marca #d75f3d (2026-08-31: fuera el negro) y el foco sigue naranja
    expect(tokens.light['primary']).toBe('oklch(0.63 0.159 36.6)')
    expect(tokens.light['primary-foreground']).toBe('oklch(0.99 0 0)')
    expect(tokens.light['ring']).toBe('oklch(0.656 0.197 32)')
    expect(tokens.dark['ring']).toBe('oklch(0.7 0.19 33)')
  })

  it('stays inside sRGB: a clipped surface loses the tint silently', () => {
    // GIVEN el tema raptor
    const tokens = deriveTheme(findTheme('raptor')!)

    // WHEN se revisan sus superficies
    // THEN todas caben en sRGB
    for (const mode of ['light', 'dark'] as const) {
      for (const [token, value] of Object.entries(tokens[mode])) {
        if (isSurfaceToken(token)) expect(insideSrgb(value)).toBe(true)
      }
    }
  })
})
