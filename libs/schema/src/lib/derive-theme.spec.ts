import { deriveTheme, Theme } from './derive-theme'
import { insideSrgb, isSurfaceToken } from './testing/srgb'

/**
 * El tema neutro tal y como lo declara hoy el esqueleto: croma 0, tono 0 y la
 * rampa sin retocar. Es el caso que NO puede cambiar ni un carácter.
 */
const neutral = (): Theme => ({
  surface: { chroma: 0, hue: 0 },
  light: {
    primary: 'oklch(0.205 0 0)',
    primaryForeground: 'oklch(0.985 0 0)',
    ring: 'oklch(0.708 0 0)',
    sidebarPrimary: 'oklch(0.205 0 0)',
    sidebarPrimaryForeground: 'oklch(0.985 0 0)'
  },
  dark: {
    primary: 'oklch(0.922 0 0)',
    primaryForeground: 'oklch(0.205 0 0)',
    ring: 'oklch(0.556 0 0)',
    sidebarPrimary: 'oklch(0.985 0 0)',
    sidebarPrimaryForeground: 'oklch(0.205 0 0)'
  }
})

const NEUTRAL_LIGHT: Record<string, string> = {
  background: 'oklch(1 0 0)',
  foreground: 'oklch(0.145 0 0)',
  card: 'oklch(1 0 0)',
  'card-foreground': 'oklch(0.145 0 0)',
  popover: 'oklch(1 0 0)',
  'popover-foreground': 'oklch(0.145 0 0)',
  primary: 'oklch(0.205 0 0)',
  'primary-foreground': 'oklch(0.985 0 0)',
  secondary: 'oklch(0.97 0 0)',
  'secondary-foreground': 'oklch(0.205 0 0)',
  muted: 'oklch(0.97 0 0)',
  'muted-foreground': 'oklch(0.556 0 0)',
  accent: 'oklch(0.97 0 0)',
  'accent-foreground': 'oklch(0.205 0 0)',
  destructive: 'oklch(0.577 0.245 27.325)',
  border: 'oklch(0.922 0 0)',
  input: 'oklch(0.922 0 0)',
  ring: 'oklch(0.708 0 0)',
  sidebar: 'oklch(0.985 0 0)',
  'sidebar-foreground': 'oklch(0.145 0 0)',
  'sidebar-primary': 'oklch(0.205 0 0)',
  'sidebar-primary-foreground': 'oklch(0.985 0 0)',
  'sidebar-accent': 'oklch(0.97 0 0)',
  'sidebar-accent-foreground': 'oklch(0.205 0 0)',
  'sidebar-border': 'oklch(0.922 0 0)',
  'sidebar-ring': 'oklch(0.708 0 0)'
}

const NEUTRAL_DARK: Record<string, string> = {
  background: 'oklch(0.145 0 0)',
  foreground: 'oklch(0.985 0 0)',
  card: 'oklch(0.205 0 0)',
  'card-foreground': 'oklch(0.985 0 0)',
  popover: 'oklch(0.205 0 0)',
  'popover-foreground': 'oklch(0.985 0 0)',
  primary: 'oklch(0.922 0 0)',
  'primary-foreground': 'oklch(0.205 0 0)',
  secondary: 'oklch(0.269 0 0)',
  'secondary-foreground': 'oklch(0.985 0 0)',
  muted: 'oklch(0.269 0 0)',
  'muted-foreground': 'oklch(0.708 0 0)',
  accent: 'oklch(0.269 0 0)',
  'accent-foreground': 'oklch(0.985 0 0)',
  destructive: 'oklch(0.704 0.191 22.216)',
  border: 'oklch(1 0 0 / 10%)',
  input: 'oklch(1 0 0 / 15%)',
  ring: 'oklch(0.556 0 0)',
  sidebar: 'oklch(0.205 0 0)',
  'sidebar-foreground': 'oklch(0.985 0 0)',
  'sidebar-primary': 'oklch(0.985 0 0)',
  'sidebar-primary-foreground': 'oklch(0.205 0 0)',
  'sidebar-accent': 'oklch(0.269 0 0)',
  'sidebar-accent-foreground': 'oklch(0.985 0 0)',
  'sidebar-border': 'oklch(1 0 0 / 10%)',
  'sidebar-ring': 'oklch(0.556 0 0)'
}

describe('deriveTheme', () => {
  describe('neutral reproduces the skeleton exactly', () => {
    it('emits the light block character for character', () => {
      // GIVEN el tema neutro
      const theme = neutral()

      // WHEN se deriva
      const tokens = deriveTheme(theme)

      // THEN el bloque claro es el que el esqueleto ya emite
      expect(tokens.light).toEqual(NEUTRAL_LIGHT)
    })

    it('emits the dark block character for character', () => {
      // GIVEN el tema neutro
      const theme = neutral()

      // WHEN se deriva
      const tokens = deriveTheme(theme)

      // THEN el bloque oscuro es el que el esqueleto ya emite
      expect(tokens.dark).toEqual(NEUTRAL_DARK)
    })
  })

  describe('a tinted theme dresses the surfaces, not just the action', () => {
    const tinted = (): Theme => ({
      // los escalones claros bajan: en sRGB el croma no cabe por encima de ~0.97,
      // así que un fondo que se queda arriba sale blanco por mucho croma que pida.
      // 'base' se queda en 1 y sin teñir: tarjetas blancas sobre página con tono
      surface: {
        chroma: 0.016,
        hue: 250,
        ramp: { page: 0.965, subtle: 0.955, wash: 0.93, line: 0.89 },
        untinted: ['base']
      },
      light: {
        primary: 'oklch(0.55 0.14 250)',
        primaryForeground: 'oklch(0.99 0 0)',
        ring: 'oklch(0.63 0.12 250)',
        sidebarPrimary: 'oklch(0.55 0.14 250)',
        sidebarPrimaryForeground: 'oklch(0.99 0 0)'
      },
      dark: {
        primary: 'oklch(0.72 0.12 250)',
        primaryForeground: 'oklch(0.17 0 0)',
        ring: 'oklch(0.63 0.12 250)',
        sidebarPrimary: 'oklch(0.72 0.12 250)',
        sidebarPrimaryForeground: 'oklch(0.17 0 0)'
      }
    })

    it('tints the light page, sidebar, chips and borders', () => {
      // GIVEN un tema con croma y tono
      const theme = tinted()

      // WHEN se deriva
      const { light } = deriveTheme(theme)

      // THEN las superficies llevan el tono, no solo el botón
      expect(light['background']).toBe('oklch(0.965 0.016 250)')
      expect(light['muted']).toBe('oklch(0.93 0.016 250)')
      expect(light['border']).toBe('oklch(0.89 0.016 250)')
      expect(light['sidebar']).toBe('oklch(0.955 0.016 250)')
    })

    it('leaves the untinted steps neutral: white cards over a tinted page', () => {
      // GIVEN un tema que declara 'base' sin teñir
      const theme = tinted()

      // WHEN se deriva
      const { light } = deriveTheme(theme)

      // THEN la tarjeta es blanco puro, y es lo que le da relieve sobre la página
      expect(light['card']).toBe('oklch(1 0 0)')
      expect(light['popover']).toBe('oklch(1 0 0)')
      expect(light['background']).not.toBe(light['card'])
    })

    it('tints the dark surfaces too', () => {
      // GIVEN un tema con croma y tono
      const theme = tinted()

      // WHEN se deriva
      const { dark } = deriveTheme(theme)

      // THEN el fondo y las tarjetas oscuras llevan el tono
      expect(dark['background']).toBe('oklch(0.145 0.016 250)')
      expect(dark['card']).toBe('oklch(0.205 0.016 250)')
      expect(dark['muted']).toBe('oklch(0.269 0.016 250)')
    })

    it('leaves the dark border as a white overlay', () => {
      // GIVEN un tema con croma y tono
      const theme = tinted()

      // WHEN se deriva
      const { dark } = deriveTheme(theme)

      // THEN el borde oscuro sigue siendo velo de blanco: teñirlo lo convierte
      // en una línea de color sobre fondo oscuro, que es lo que evita el velo
      expect(dark['border']).toBe('oklch(1 0 0 / 10%)')
      expect(dark['input']).toBe('oklch(1 0 0 / 15%)')
    })

    it('keeps every tinted surface inside sRGB, or the tint is silently lost', () => {
      // GIVEN un tema con croma y tono
      const { light, dark } = deriveTheme(tinted())

      // WHEN se convierte cada superficie a sRGB
      // THEN ninguna se sale del gamut: fuera de él el navegador recorta a blanco
      // y la superficie se ve neutra por mucho croma que declare
      for (const [name, value] of [...Object.entries(light), ...Object.entries(dark)]) {
        if (!isSurfaceToken(name)) continue
        expect({ name, value, inside: insideSrgb(value) }).toMatchObject({ inside: true })
      }
    })

    it('a theme without radius keeps the skeleton radius (frozen fixtures intact)', () => {
      // GIVEN el tema neutro, que no declara radio
      const tokens = deriveTheme(neutral())

      // THEN el radio es el del esqueleto
      expect(tokens.radius).toBe('0.625rem')
    })

    it('a theme with radius carries it into its tokens', () => {
      // GIVEN un tema que declara su radio
      const theme = { ...tinted(), radius: '0.25rem' }

      // WHEN se deriva
      const tokens = deriveTheme(theme)

      // THEN el radio viaja con el resto de tokens
      expect(tokens.radius).toBe('0.25rem')
    })

    it('does not touch the ramp of other themes', () => {
      // GIVEN un tema que retoca la rampa
      deriveTheme(tinted())

      // WHEN se deriva después el neutro
      const tokens = deriveTheme(neutral())

      // THEN el neutro sigue intacto: la rampa compartida no se muta
      expect(tokens.light['background']).toBe('oklch(1 0 0)')
    })
  })
})
