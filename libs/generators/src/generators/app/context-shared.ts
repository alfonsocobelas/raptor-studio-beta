import type { ResourceDefinition } from '@acc/schema'
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
