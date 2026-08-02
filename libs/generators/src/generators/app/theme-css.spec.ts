import { themeSubstitutions } from './theme-css'

/**
 * El orden de los tokens en el fichero emitido. NO es cosmético: la fixture de
 * oro está congelada con este orden, así que cambiarlo rompe el gate.
 */
const ORDER = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--popover',
  '--popover-foreground',
  '--primary',
  '--primary-foreground',
  '--secondary',
  '--secondary-foreground',
  '--muted',
  '--muted-foreground',
  '--accent',
  '--accent-foreground',
  '--destructive',
  '--border',
  '--input',
  '--ring',
  '--sidebar',
  '--sidebar-foreground',
  '--sidebar-primary',
  '--sidebar-primary-foreground',
  '--sidebar-accent',
  '--sidebar-accent-foreground',
  '--sidebar-border',
  '--sidebar-ring'
]

const namesOf = (block: string): string[] => block.split('\n').map(line => line.trim().split(':')[0])

describe('themeSubstitutions — el tema declarado alimenta el styles.css emitido', () => {
  describe('neutral', () => {
    it('nombra la clase del body con el tema', () => {
      // GIVEN el tema por defecto
      // WHEN se preparan las sustituciones
      const subs = themeSubstitutions('neutral')

      // THEN la clase es la que el esqueleto ya emite
      expect(subs.themeClass).toBe('theme-neutral')
    })

    it('emite los 26 tokens claros en el orden congelado, con su sangría', () => {
      // GIVEN el tema por defecto
      // WHEN se prepara el bloque claro
      const { lightTokens } = themeSubstitutions('neutral')
      const lines = lightTokens.split('\n')

      // THEN cada línea es un token CSS sangrado a dos espacios, en su sitio
      expect(lines).toHaveLength(ORDER.length)
      expect(namesOf(lightTokens)).toEqual(ORDER)
      for (const line of lines) {
        expect(line).toMatch(/^ {2}--[a-z-]+: .+;$/)
      }
    })

    it('abre en blanco puro y cierra en el anillo gris, como hoy', () => {
      // GIVEN el tema por defecto
      // WHEN se prepara el bloque claro
      const { lightTokens } = themeSubstitutions('neutral')

      // THEN los extremos son exactamente los del esqueleto
      expect(lightTokens.split('\n')[0]).toBe('  --background: oklch(1 0 0);')
      expect(lightTokens.split('\n').at(-1)).toBe('  --sidebar-ring: oklch(0.708 0 0);')
    })

    it('emite el bloque oscuro con el velo de blanco en bordes y campos', () => {
      // GIVEN el tema por defecto
      // WHEN se prepara el bloque oscuro
      const { darkTokens } = themeSubstitutions('neutral')

      // THEN es el bloque .dark de hoy
      expect(namesOf(darkTokens)).toEqual(ORDER)
      expect(darkTokens).toContain('  --background: oklch(0.145 0 0);')
      expect(darkTokens).toContain('  --border: oklch(1 0 0 / 10%);')
      expect(darkTokens).toContain('  --input: oklch(1 0 0 / 15%);')
    })
  })

  describe('un tema del catálogo', () => {
    it('nombra la clase con su id: el gancho del body deja de mentir', () => {
      // GIVEN un tema con color
      // WHEN se preparan las sustituciones
      const subs = themeSubstitutions('ocean')

      // THEN la clase dice qué tema lleva la app
      expect(subs.themeClass).toBe('theme-ocean')
    })

    it('viste las superficies, no solo la acción', () => {
      // GIVEN un tema con color
      // WHEN se prepara el bloque claro
      const { lightTokens } = themeSubstitutions('ocean')

      // THEN el fondo y las tarjetas llevan el tono, que es lo que la spec 18 no hacía
      expect(lightTokens).toContain('  --background: oklch(0.99 0.012 236);')
      expect(lightTokens).toContain('  --card: oklch(0.99 0.012 236);')
      expect(lightTokens).toContain('  --primary: oklch(0.55 0.14 235);')
    })

    it('tiñe también el oscuro', () => {
      // GIVEN un tema con color
      // WHEN se prepara el bloque oscuro
      const { darkTokens } = themeSubstitutions('ocean')

      // THEN el fondo oscuro lleva el tono
      expect(darkTokens).toContain('  --background: oklch(0.145 0.012 236);')
      expect(darkTokens).toContain('  --primary: oklch(0.72 0.12 236);')
    })
  })

  describe('un tema desconocido', () => {
    it('cae al neutro en vez de romper la generación a medias', () => {
      // GIVEN un id que el catálogo no conoce (el gate del schema ya lo rechazó antes)
      // WHEN se preparan las sustituciones
      const subs = themeSubstitutions('fucsia-flúor')

      // THEN sale la app neutra: media app generada es peor que una app sosa
      expect(subs.themeClass).toBe('theme-neutral')
      expect(subs.lightTokens).toBe(themeSubstitutions('neutral').lightTokens)
    })
  })
})
