import type { Tree } from '@nx/devkit'
import { updateJson } from '@nx/devkit'
import { DEFAULT_THEME_ID, TOKEN_ORDER, deriveTheme, findTheme, seedTheme } from '@raptor/schema'

/**
 * Sustituciones del tema para el styles.css y el index.html emitidos (spec 20).
 *
 * Toda la derivación ocurre aquí: la plantilla solo interpola dos bloques ya
 * escritos. Es la regla del proyecto — plantillas tontas, lógica en el
 * generador— y además evita el regex frágil que la spec 18 usaba para
 * reescribir tres líneas sobre un fichero ya copiado.
 */
export interface ThemeSubstitutions {
  /** Clase del <body>; nombra el tema en vez de mentir con 'theme-neutral' */
  themeClass: string
  lightTokens: string
  darkTokens: string
  /** Radio de esquinas del tema (fase 2); sin declarar, el del esqueleto */
  radius: string
  /** Familia tipográfica del tema (fase 3); '' = la pila de sistema del esqueleto */
  fontFamily: string
  /** Paquete npm self-hosted que aporta la fuente; '' = ninguno */
  fontPackage: string
  /**
   * Tokens del preset de diseño que pisan a los del tema (spec 67). Se interpolan DENTRO del
   * bloque `:root .theme-x`, detrás de los del tema: en `:root` suelto no se aplicarían.
   */
  designTokens: string
  /** Líneas @import de las fuentes de la piel, ya renderizadas; '' = la piel no trae letra */
  designFontImports: string
  /** Bloque CSS del preset de diseño (spec 37); '' = el preset neutro, que no añade nada */
  designCss: string
}

const block = (tokens: Record<string, string>): string =>
  TOKEN_ORDER.map(name => `  --${name}: ${tokens[name]};`).join('\n')

export function themeSubstitutions(themeId: string, seed?: string): ThemeSubstitutions {
  // un id desconocido no puede reventar la generación: el gate del schema ya lo
  // rechazó antes, y aquí un fallo dejaría media app en disco.
  // La semilla gana (fase 4): del color de marca se deriva el tema completo
  const theme = seed ? seedTheme(seed) : (findTheme(themeId) ?? findTheme(DEFAULT_THEME_ID))
  if (!theme) throw new Error(`missing default theme '${DEFAULT_THEME_ID}'`)

  const tokens = deriveTheme(theme)

  return {
    themeClass: `theme-${theme.id}`,
    lightTokens: block(tokens.light),
    darkTokens: block(tokens.dark),
    radius: tokens.radius,
    fontFamily: tokens.font?.family ?? '',
    fontPackage: tokens.font?.package ?? '',
    // el preset los sobreescribe en app.ts; por defecto el tema no lleva cromo de diseño
    designTokens: '',
    designFontImports: '',
    designCss: ''
  }
}

/**
 * La fuente del tema es una dependencia MÁS de la app emitida: los ficheros los aporta su paquete
 * fontsource (self-hosted, sin CDNs) y el npm install de la app los trae. La misma horquilla ^5 que
 * el Roboto que la piel material ya declara en el esqueleto.
 */
export function addFontDependency(tree: Tree, packageJsonPath: string, fontPackage: string): void {
  if (!fontPackage) return
  updateJson(tree, packageJsonPath, json => {
    json.dependencies = { ...json.dependencies, [fontPackage]: '^5.1.0' }
    return json
  })
}
