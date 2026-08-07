import { names } from '@nx/devkit'
import type { ResourceDefinition, SharedVoDefinition } from '@acc/schema'
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
export const EMITTED_VO_KINDS: SharedVoDefinition['kind'][] = ['date', 'timestamp']

/** Lo que las plantillas de un VO compartido necesitan, ya masticado. */
export interface SharedVoSubstitutions {
  className: string
  fileName: string
  fieldName: string
  context: string
  needsNullable: boolean
  hasUnset: boolean
  namedNull: string
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

  return {
    className: n.className,
    fileName: n.fileName,
    fieldName: vo.fieldName ?? n.className,
    context,
    needsNullable: vo.unset === true || namedNull !== '',
    hasUnset: vo.unset === true,
    namedNull,
    tmpl: ''
  }
}
