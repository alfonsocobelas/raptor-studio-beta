import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { generateFiles } from '@nx/devkit'
import { join } from 'path'
import { addFontDependency, themeSubstitutions, type ThemeSubstitutions } from './theme-css'

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
      expect(lightTokens).toContain('  --background: oklch(0.965 0.016 236);')
      expect(lightTokens).toContain('  --muted: oklch(0.93 0.016 236);')
      expect(lightTokens).toContain('  --border: oklch(0.89 0.016 236);')
      expect(lightTokens).toContain('  --primary: oklch(0.55 0.14 235);')
      // la tarjeta se queda blanca: es lo que le da relieve sobre la página teñida
      expect(lightTokens).toContain('  --card: oklch(1 0 0);')
    })

    it('tiñe también el oscuro', () => {
      // GIVEN un tema con color
      // WHEN se prepara el bloque oscuro
      const { darkTokens } = themeSubstitutions('ocean')

      // THEN el fondo oscuro lleva el tono
      expect(darkTokens).toContain('  --background: oklch(0.145 0.016 236);')
      expect(darkTokens).toContain('  --primary: oklch(0.72 0.12 236);')
    })
  })

  describe('el radio del tema (fase 2)', () => {
    it('sin radio declarado emite el del esqueleto: fixture congelada intacta', () => {
      // GIVEN el catálogo actual, donde ningún tema declara radio
      // WHEN se preparan las sustituciones
      const subs = themeSubstitutions('neutral')

      // THEN el radio es el que styles.css lleva escrito hoy
      expect(subs.radius).toBe('0.625rem')
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

/**
 * Fase 3 (spec 20): la fuente del tema, self-hosted. Sin fuente declarada las sustituciones
 * quedan vacías y el styles.css emitido es byte a byte el de siempre.
 */
describe('la fuente del tema (fase 3)', () => {
  it('sin fuente declarada no hay familia ni import: fixture congelada intacta', () => {
    const subs = themeSubstitutions('neutral')

    expect(subs.fontFamily).toBe('')
    expect(subs.fontPackage).toBe('')
  })
})

describe('la fuente en la app emitida (fase 3)', () => {
  // se renderiza la plantilla real con generateFiles, igual que el ensamblador
  const render = (subs: ThemeSubstitutions): string => {
    const tree = createTreeWithEmptyWorkspace()
    generateFiles(tree, join(__dirname, 'files-theme/spartan'), 'out', { ...subs, tmpl: '' })
    return tree.read('out/apps/frontend-app/src/styles.css', 'utf-8') ?? ''
  }
  const base = themeSubstitutions('neutral')

  it('un tema con fuente añade su import self-hosted y antepone la familia a la pila', () => {
    const css = render({ ...base, fontFamily: 'Inter Variable', fontPackage: '@fontsource-variable/inter' })

    expect(css).toContain(`@import '@fontsource-variable/inter';`)
    expect(css).toMatch(/--font-sans:\n\s+'Inter Variable',\n\s+-apple-system/)
  })

  it('sin fuente el css es EXACTAMENTE el de siempre: fixture congelada intacta', () => {
    const css = render(base)

    expect(css).not.toContain('fontsource')
    expect(css).toMatch(/--font-sans:\n\s+-apple-system/)
  })

  it('addFontDependency añade el paquete a las dependencias de la app emitida', () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('out/package.json', JSON.stringify({ dependencies: { rxjs: '^7' } }))

    addFontDependency(tree, 'out/package.json', '@fontsource-variable/inter')
    const pkg = JSON.parse(tree.read('out/package.json', 'utf-8') ?? '{}') as {
      dependencies: Record<string, string>
    }

    expect(pkg.dependencies['@fontsource-variable/inter']).toBe('^5.1.0')
    expect(pkg.dependencies['rxjs']).toBe('^7')
  })

  it('sin paquete no toca el package.json', () => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write('out/package.json', JSON.stringify({ dependencies: {} }))

    addFontDependency(tree, 'out/package.json', '')

    expect(JSON.parse(tree.read('out/package.json', 'utf-8') ?? '{}')).toEqual({ dependencies: {} })
  })
})

describe('el tema de semilla en la emisión (fase 4)', () => {
  it('la semilla gana: tokens teñidos con el tono de la marca y clase que la delata', () => {
    const subs = themeSubstitutions('neutral', '#1a6dff')

    expect(subs.themeClass).toBe('theme-seed-1a6dff')
    // la página clara lleva el tono de la marca (croma de superficie del catálogo)
    expect(subs.lightTokens).toMatch(/--background: oklch\(0\.965 0\.016 \d/)
    // y la primaria sigue la receta (L .53)
    expect(subs.lightTokens).toMatch(/--primary: oklch\(0\.53 /)
  })

  it('sin semilla todo sigue igual', () => {
    expect(themeSubstitutions('neutral').themeClass).toBe('theme-neutral')
  })
})
