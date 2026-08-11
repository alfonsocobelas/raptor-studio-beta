import type { Tree } from '@nx/devkit'
import { type AiSlotRef, listEmptyAiSlots } from '../resource/ai-slots'

/** Prefijo de los huecos que emite un flujo: `// @ai:begin flow-<nodeId>` */
const FLOW_PREFIX = 'flow-'

export interface FillFlowSlotsGeneratorSchema {
  /** Directorio de la app ya emitida sobre la que se rellena (p.ej. apps/solaris) */
  directory: string
}

/** Quién escribe el cuerpo del paso. Hoy solo `none`: el puente lo cablea el bloque B. */
export type FlowFillExecutor = 'none' | 'bridge'

export interface FlowFillReport {
  executor: FlowFillExecutor
  /** Huecos de paso que siguen vacíos, en orden de recorrido del árbol */
  pending: AiSlotRef[]
  /** Huecos rellenados y aceptados por el gate; vacío mientras no haya ejecutor */
  filled: AiSlotRef[]
}

/** Los huecos de paso que siguen sin cuerpo en una app emitida. */
export function pendingFlowSlots(tree: Tree, directory: string): AiSlotRef[] {
  return listEmptyAiSlots(tree, directory, FLOW_PREFIX)
}

/**
 * Informe del relleno. Función pura y separada del generador porque Nx invoca como
 * callback lo que un generador devuelve (`if (task) await task()`): el generador
 * informa por consola y devuelve void, y los datos se leen desde aquí.
 */
export function flowFillReport(tree: Tree, options: FillFlowSlotsGeneratorSchema): FlowFillReport {
  return {
    // sin ejecutor no se toca nada: la IA vive en los bordes y siempre bajo gate
    executor: 'none',
    pending: pendingFlowSlots(tree, options.directory),
    filled: []
  }
}

/**
 * Comando de relleno de los huecos de paso (spec 39, bloque B). De momento solo
 * recolecta: lista lo pendiente y termina sin escribir. Cuando haya ejecutor, cada
 * hueco pasará su propio gate determinista antes de quedarse en el árbol.
 */
export async function fillFlowSlotsGenerator(tree: Tree, options: FillFlowSlotsGeneratorSchema): Promise<void> {
  if (!tree.exists(options.directory)) {
    throw new Error(`El directorio '${options.directory}' no existe: nada que rellenar`)
  }

  const report = flowFillReport(tree, options)

  if (!report.pending.length) {
    console.log(`No hay huecos de paso pendientes en ${options.directory}`)
    return
  }

  console.log(`${report.pending.length} hueco(s) de paso pendiente(s) en ${options.directory}:`)
  for (const slot of report.pending) {
    console.log(`  · ${slot.id} — ${slot.file}`)
  }
  if (report.executor === 'none') {
    console.log('Sin ejecutor de IA disponible: no se ha tocado nada.')
  }
}

export default fillFlowSlotsGenerator
