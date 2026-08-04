/**
 * Title case con reglas de es-ES, compartido por los VOs que normalizan texto libre que llega del
 * feed de SAP en capitalización arbitraria ("MADRID" y "Madrid" para el mismo municipio).
 *
 * Vive aquí, y no dentro de un VO concreto, porque lo necesitan varios: `CustomerName` mantiene
 * ADEMÁS sus propias reglas (formas jurídicas, acrónimos) y `CustomerCity` solo necesita esto.
 */

/** Palabras que van en minúscula salvo al principio del nombre. */
const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'i', 'a', '&'])

/**
 * Separadores que van DENTRO de una palabra y tras los cuales sigue habiendo mayúscula:
 * el guion de los topónimos compuestos (Vitoria-Gasteiz) y el apóstrofe catalán (L'Hospitalet,
 * D'Andorra). El punto queda fuera a propósito: rompería las formas jurídicas (S.A., S.L.U.).
 */
const INNER_SEPARATORS = /([-'’])/

const capitalizeSegment = (lower: string): string => lower.charAt(0).toLocaleUpperCase('es-ES') + lower.slice(1)

/** Capitaliza cada tramo de la palabra, tratando guiones y apóstrofes como inicio de tramo. */
export const capitalizeSpanishWord = (lower: string): string =>
  lower
    .split(INNER_SEPARATORS)
    .map(segment => (INNER_SEPARATORS.test(segment) ? segment : capitalizeSegment(segment)))
    .join('')

/**
 * Colapsa los espacios internos y capitaliza cada palabra respetando los conectores.
 * Las palabras de una o dos letras se dejan en mayúsculas: suelen ser siglas o partículas
 * ("OS", "AS") y bajarlas a minúscula haría más daño que dejarlas.
 */
export function spanishTitleCase(raw: string): string {
  const collapsed = raw.trim().replace(/\s+/g, ' ')

  if (collapsed === '') {
    return ''
  }

  return collapsed
    .split(' ')
    .map((word, index) => {
      const lower = word.toLocaleLowerCase('es-ES')

      if (CONNECTORS.has(lower)) {
        return index === 0 ? capitalizeSpanishWord(lower) : lower
      }

      const letters = word.replace(/[^\p{L}]/gu, '')
      if (letters.length === 0) {
        return word
      }
      if (letters.length <= 2) {
        return word.toLocaleUpperCase('es-ES')
      }

      return capitalizeSpanishWord(lower)
    })
    .join(' ')
}
