import { names } from '@nx/devkit'
import type { ResourceDefinition, SharedVoDefinition } from '@raptor/schema'
import { SHARED_VOS, sharedVosOf } from '../resource/models/shared-vos'

/** Los VOs compartidos que un contexto necesita, con el contexto que los aloja. */
export interface ContextSharedGroup {
  context: string
  vos: string[]
}

/**
 * La capa compartida es de un CONTEXTO, no de la app: `<contexto>/shared/domain/` es la ruta que
 * importan los módulos emitidos (`'../../../shared/domain/constants'`, tres niveles desde
 * `modules/<plural>/domain/`). Una app con dos contextos emite dos carpetas, cada una con lo suyo;
 * un contexto que no referencia ningún VO compartido no emite nada.
 *
 * El orden de los contextos es el de aparición de los modelos; el de los VOs, el del registro
 * (`sharedVosOf`): la emisión debe ser determinista.
 */
export function contextSharedGroups(models: ResourceDefinition[]): ContextSharedGroup[] {
  const byContext = new Map<string, ResourceDefinition[]>()

  for (const model of models) {
    const siblings = byContext.get(model.context)
    if (siblings) {
      siblings.push(model)
    } else {
      byContext.set(model.context, [model])
    }
  }

  return [...byContext.entries()]
    .map(([context, contextModels]) => ({ context, vos: sharedVosOf(contextModels) }))
    .filter(group => group.vos.length > 0)
}

/**
 * `constants.ts` DERIVADO: la unión de los `constraintKey` de los VOs que esta app emite de verdad,
 * con sus MIN/MAX. No se copia del canon — una app sin `Phone` no arrastra `PHONE`. Los VOs sin
 * longitudes (fechas, timestamps, período) no aportan clave.
 */
export function sharedConstraintEntries(vos: string[]): string[] {
  const entries: string[] = []

  for (const name of vos) {
    const vo = SHARED_VOS[name]
    if (!vo?.constraintKey) {
      continue
    }
    const bounds: string[] = []
    if (vo.min !== undefined) bounds.push(`MIN: ${vo.min}`)
    if (vo.max !== undefined) bounds.push(`MAX: ${vo.max}`)
    if (bounds.length === 0) {
      continue
    }
    entries.push(`${vo.constraintKey}: { ${bounds.join(', ')} }`)
  }

  return entries
}

/**
 * Los `kind` que ya tienen plantilla. La spec 27 los va abriendo de uno en uno (TASK-03 date y
 * timestamp, TASK-04 string, TASK-05 period): un VO de un kind todavía sin plantilla se salta en
 * vez de romper la emisión, y lo delata el gate de compilación, no una excepción del generador.
 */
export const EMITTED_VO_KINDS: SharedVoDefinition['kind'][] = ['date', 'timestamp', 'string', 'period']

/** Las normalizaciones que ya tienen plantilla; `spanish-legal-name` espera al helper del kernel. */
const EMITTED_NORMALIZE_RULES = ['collapse-whitespace', 'spanish-legal-name']

/**
 * Un VO se emite cuando su kind Y su normalización tienen plantilla. Mientras la spec avanza, lo que
 * falta se salta en vez de emitir código que no compila: quien lo delata es el gate de compilación.
 */
export function canEmitSharedVo(vo: SharedVoDefinition): boolean {
  if (!EMITTED_VO_KINDS.includes(vo.kind)) {
    return false
  }
  return !vo.normalize || EMITTED_NORMALIZE_RULES.includes(vo.normalize.rule)
}

/**
 * Candidatos con los que se construyen los valores de los tests emitidos: los dos primeros que el
 * juego de caracteres admita son el relleno y su alternativa; los que rechace son los ejemplos de
 * carácter prohibido. Todo derivado del `charset` declarado — el test no trae valores a mano.
 */
const FILL_CANDIDATES = ['1', '2', '3', 'a', 'b']
const BAD_CANDIDATES = ['@', '#', '_', ',', ';', 'a']
const DEFAULT_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const CHARSET_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz+()-/.'
/** Tope del test de propiedad cuando el VO no declara MAX: no hay longitud que respetar, sólo forma. */
const UNBOUNDED_SAMPLE_LENGTH = 20

/** Lo que las plantillas de un VO compartido necesitan, ya masticado. */
export interface SharedVoSubstitutions {
  className: string
  fileName: string
  fieldName: string
  context: string
  needsNullable: boolean
  hasUnset: boolean
  namedNull: string
  constraintKey: string
  hasMin: boolean
  hasMax: boolean
  minExpr: string
  validExpr: string
  otherExpr: string
  maxExpr: string
  ensureGuard: string
  requiresContent: boolean
  noInnerWhitespace: boolean
  collapsesWhitespace: boolean
  charsetPattern: string
  charsetMessage: string
  fillChar: string
  altChar: string
  alphabet: string
  disallowedSamples: string
  ofClass: string
  ofFile: string
  spanishLegalName: boolean
  acronymsList: string
  acronym0: string
  acronym0Lower: string
  acronym1: string
  acronym1Lower: string
  tmpl: ''
}

/**
 * `Nullable` sólo se importa si algo lo usa: el `unset()` de una fecha o el null con nombre de un
 * timestamp. Emitir el import «por si acaso» dejaría un unused en el emitido, que compila con
 * `noUnusedLocals` en la app generada.
 */
export function sharedVoSubstitutions(name: string, vo: SharedVoDefinition, context: string): SharedVoSubstitutions {
  const n = names(name)
  const namedNull = vo.namedNull ?? ''
  const allows = charsetFilter(vo.charset?.pattern)
  const legal = vo.normalize?.rule === 'spanish-legal-name' ? vo.normalize : null
  // los casos de acrónimo del test emitido se derivan de la tabla declarada; los de 1-2 letras no
  // sirven de muestra (cualquier palabra corta se sube a mayúsculas, listada o no)
  const longAcronyms = (legal?.acronyms ?? []).filter(a => a.length >= 3)
  const acronym0 = longAcronyms[0] ?? ''
  const acronym1 = longAcronyms[1] ?? acronym0
  const [fillChar, altChar] = FILL_CANDIDATES.filter(allows)
  const alphabet = vo.charset ? [...CHARSET_ALPHABET].filter(allows).join('') : DEFAULT_ALPHABET

  return {
    className: n.className,
    fileName: n.fileName,
    fieldName: vo.fieldName ?? n.className,
    context,
    needsNullable: vo.unset === true || namedNull !== '',
    hasUnset: vo.unset === true,
    namedNull,
    constraintKey: vo.constraintKey ?? '',
    hasMin: vo.min !== undefined,
    hasMax: vo.max !== undefined,
    // el test referencia la constante, no el número: si mañana cambia MIN, el test sigue diciendo
    // la verdad. Sin MIN declarado, un carácter basta para tener un valor válido
    minExpr: vo.min !== undefined ? 'MIN' : '1',
    validExpr: vo.min !== undefined ? `'${fillChar}'.repeat(MIN)` : `'${fillChar}'`,
    otherExpr: vo.min !== undefined ? `'${altChar}'.repeat(MIN)` : `'${altChar}'`,
    maxExpr: vo.max !== undefined ? 'MAX' : String(UNBOUNDED_SAMPLE_LENGTH),
    ensureGuard: vo.ensure === 'string' ? 'ensureIsString' : 'ensureIsDefined',
    requiresContent: vo.ensure === 'string',
    noInnerWhitespace: vo.noInnerWhitespace === true,
    collapsesWhitespace: vo.normalize?.rule === 'collapse-whitespace',
    charsetPattern: vo.charset?.pattern ?? '',
    charsetMessage: vo.charset?.message ?? '',
    fillChar,
    altChar,
    alphabet,
    disallowedSamples: BAD_CANDIDATES.filter(char => !allows(char))
      .map(char => `'${char}'`)
      .join(', '),
    ofClass: vo.of ? names(vo.of).className : '',
    ofFile: vo.of ? names(vo.of).fileName : '',
    spanishLegalName: legal !== null,
    acronymsList: (legal?.acronyms ?? []).map(a => `'${a}'`).join(', '),
    acronym0,
    acronym0Lower: acronym0.toLocaleLowerCase('es-ES'),
    acronym1,
    acronym1Lower: acronym1.toLocaleLowerCase('es-ES'),
    tmpl: ''
  }
}

/**
 * Qué carpeta de plantillas de TEST le toca a un VO: la normalización española tiene la suya —
 * su test es la demostración del algoritmo, no el de un string normal.
 */
export function sharedVoTestKind(vo: SharedVoDefinition): string {
  return vo.normalize?.rule === 'spanish-legal-name' ? 'string-legal-name' : vo.kind
}

/** ¿Admite el juego de caracteres declarado este carácter suelto? Sin `charset`, todo vale. */
function charsetFilter(pattern?: string): (char: string) => boolean {
  if (!pattern) {
    return () => true
  }
  const allowed = new RegExp(pattern)
  return char => allowed.test(char)
}
