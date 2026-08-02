import { DEFAULT_THEME_ID, deriveTheme, findTheme } from '@acc/schema'
import type { PreviewTheme } from './preview-settings'

/**
 * Tokens del tema como propiedades CSS, para pintarlos en el lienzo (spec 20).
 *
 * Salen de la MISMA `deriveTheme` que alimenta el styles.css emitido. Antes el
 * lienzo llevaba su propio juego escrito a mano, y ya había derivado: pintaba
 * el primario en 0.25 cuando el generador emitía 0.205, y el borde oscuro al
 * 12% cuando el emitido va al 10%. Una sola fuente evita volver a eso.
 */
export function previewThemeVars(themeId: string, mode: PreviewTheme): Record<string, string> {
  const theme = findTheme(themeId) ?? findTheme(DEFAULT_THEME_ID)
  if (!theme) return {}

  const tokens = deriveTheme(theme)[mode]

  return Object.fromEntries(Object.entries(tokens).map(([name, value]) => [`--${name}`, value]))
}
