import { DEFAULT_THEME_ID, TOKEN_ORDER, deriveTheme, findTheme } from '@acc/schema'

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
}

const block = (tokens: Record<string, string>): string =>
  TOKEN_ORDER.map(name => `  --${name}: ${tokens[name]};`).join('\n')

export function themeSubstitutions(themeId: string): ThemeSubstitutions {
  // un id desconocido no puede reventar la generación: el gate del schema ya lo
  // rechazó antes, y aquí un fallo dejaría media app en disco
  const theme = findTheme(themeId) ?? findTheme(DEFAULT_THEME_ID)
  if (!theme) throw new Error(`missing default theme '${DEFAULT_THEME_ID}'`)

  const tokens = deriveTheme(theme)

  return {
    themeClass: `theme-${theme.id}`,
    lightTokens: block(tokens.light),
    darkTokens: block(tokens.dark)
  }
}
