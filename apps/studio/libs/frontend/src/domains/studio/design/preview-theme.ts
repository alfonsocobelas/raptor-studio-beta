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

  return {
    ...Object.fromEntries(Object.entries(tokens).map(([name, value]) => [`--${name}`, value])),
    // el radio solo se pisa si el tema lo DECLARA: inline gana a las reglas del
    // preview-scope, y sin esto la piel material perdería su redondeo propio
    ...(theme.radius ? { '--radius': theme.radius } : {}),
    // la fuente igual (fase 3): la familia se antepone a la pila, como en el styles.css emitido.
    // El día que el catálogo declare una, el estudio debe instalar su paquete fontsource para
    // que el lienzo la RENDERICE — sin él, el navegador cae a la pila y miente lo justo
    ...(theme.font ? { '--font-sans': `'${theme.font.family}', var(--font-sans)` } : {})
  }
}
