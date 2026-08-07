import { capitalizeSpanishWord } from './spanish-title-case'

/**
 * Normalización de razones sociales españolas: canoniza la forma jurídica al final del nombre
 * (SOCIEDAD LIMITADA → S.L., SLU → S.L.U.), pone cada palabra en title-case y baja los conectores.
 *
 * Vive aquí y no dentro de un VO concreto porque el algoritmo es de España, no de un cliente: las
 * tablas que sí son del cliente (sus acrónimos) llegan como argumento desde la declaración del VO.
 */

/** Palabras que van en minúscula salvo al principio del nombre. */
const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'i', '&'])

/** Formas ya canónicas: se respetan tal cual al pasar el title-case. */
const CANONICAL_LEGAL_FORMS = new Set(['S.L.', 'S.A.', 'S.L.U.', 'S.A.U.', 'S.C.', 'S.L.P.', 'S.G.P.S.', 'S.Coop.'])

/** Variantes que aparecen al final del nombre, con su forma canónica. El orden importa: primero las largas. */
const LEGAL_FORMS: ReadonlyArray<[RegExp, string]> = [
  [/,?\s+sociedad\s+limitada\s*$/i, ' S.L.'],
  [/,?\s+sociedad\s+an[oó]nima\s*$/i, ' S.A.'],
  [/,?\s+s\.?\s?g\.?\s?p\.?\s?s\.?\s*$/i, ' S.G.P.S.'],
  [/,?\s+s\.?\s?l\.?\s?p\.?\s*$/i, ' S.L.P.'],
  [/,?\s+s\.?\s?l\.?\s?u\.?\s*$/i, ' S.L.U.'],
  [/,?\s+s\.?\s?a\.?\s?u\.?\s*$/i, ' S.A.U.'],
  [/,?\s+s\.?\s?coop\.?\s*$/i, ' S.Coop.'],
  [/,?\s+s\.?l\.?\s*$/i, ' S.L.'],
  [/,?\s+s\.?a\.?\s*$/i, ' S.A.'],
  [/,?\s+s\.?c\.?\s*$/i, ' S.C.']
]

export function normalizeSpanishLegalName(raw: string, acronyms: readonly string[]): string {
  const collapsed = raw.trim().replace(/\s+/g, ' ')
  if (collapsed === '') {
    return ''
  }

  const withLegalForm = canonicalizeLegalForm(collapsed)
  return withLegalForm
    .split(' ')
    .map((word, index) => titleCaseWord(word, index, acronyms))
    .join(' ')
}

/** Puede haber más de una forma apilada al final (holding + forma: «S.G.P.S. S.A.»). */
function canonicalizeLegalForm(name: string): string {
  let remaining = name
  const suffixes: string[] = []

  for (let round = 0; round < LEGAL_FORMS.length; round++) {
    const match = LEGAL_FORMS.find(([pattern]) => pattern.test(remaining))
    if (!match) {
      break
    }
    const [pattern, canonical] = match
    remaining = remaining.replace(pattern, '')
    suffixes.unshift(canonical.trim())
  }

  if (suffixes.length === 0) {
    return name
  }
  return `${remaining.replace(/[.,]+\s*$/, '')} ${suffixes.join(' ')}`
}

function titleCaseWord(word: string, index: number, acronyms: readonly string[]): string {
  if (CANONICAL_LEGAL_FORMS.has(word)) {
    return word
  }

  const lower = word.toLocaleLowerCase('es-ES')
  if (CONNECTORS.has(lower)) {
    return index === 0 ? capitalizeSpanishWord(lower) : lower
  }

  const upper = word.toLocaleUpperCase('es-ES')
  if (acronyms.includes(upper)) {
    return upper
  }

  const letterCount = word.replace(/[^\p{L}]/gu, '').length
  if (letterCount === 0) {
    return word
  }
  if (letterCount <= 2) {
    return upper
  }
  // el helper compartido conserva la mayúscula tras los separadores internos: el guion de los
  // compuestos («Antolin-Irausa») y el apóstrofe catalán («D'Andorra»)
  return capitalizeSpanishWord(lower)
}
