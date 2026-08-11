import type { Tree } from '@nx/devkit'
import { type AiSlotRef, listEmptyAiSlots, readSlotBody, replaceSlotBody } from '../resource/ai-slots'
import { buildFlowSlotPrompt } from './prompt'
import { validateSlotOnlyEdit } from './slot-write'

/** Prefijo de los huecos que emite un flujo: `// @ai:begin flow-<nodeId>` */
const FLOW_PREFIX = 'flow-'

export interface FillFlowSlotsGeneratorSchema {
  /** Directorio de la app ya emitida sobre la que se rellena (p.ej. apps/solaris) */
  directory: string
}

/**
 * Quien escribe el cuerpo de un paso. Recibe el prompt acotado y el fichero actual, y
 * propone el fichero ENTERO ya relleno; la frontera decide si esa propuesta vale. El
 * ejecutor real es una sesión de Claude Code por puente, nunca un SDK embebido.
 */
export interface SlotExecutor {
  readonly name: string
  propose(prompt: string, slot: AiSlotRef, current: string): Promise<string | undefined>
}

/** El gate determinista de un hueco: devuelve el motivo del rechazo, o nada si pasa. */
export interface SlotGate {
  run(slot: AiSlotRef): Promise<string | undefined>
}

export interface FlowFillOptions extends FillFlowSlotsGeneratorSchema {
  executor?: SlotExecutor
  gate?: SlotGate
}

export interface FlowFillRejection {
  slot: AiSlotRef
  reason: string
}

export interface FlowFillReport {
  /** Nombre del ejecutor usado, o 'none' si no había */
  executor: string
  /** Huecos de paso que siguen vacíos, en orden de recorrido del árbol */
  pending: AiSlotRef[]
  /** Huecos rellenados y aceptados por el gate */
  filled: AiSlotRef[]
  /** Huecos que se intentaron y no pasaron, con el motivo */
  rejected: FlowFillRejection[]
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
    filled: [],
    rejected: []
  }
}

/**
 * Rellena los huecos de paso pendientes, uno a uno y cada uno bajo su propio gate
 * (spec 39, TASK-12). El orden importa: primero la frontera de escritura (barata),
 * después el gate de build+test (caro), y si algo falla el hueco vuelve a quedar
 * vacío con su motivo. Nunca queda código rojo en la app emitida.
 */
export async function fillPendingFlowSlots(tree: Tree, options: FlowFillOptions): Promise<FlowFillReport> {
  const { directory, executor, gate } = options

  if (!executor) return flowFillReport(tree, options)
  if (!gate) throw new Error('Un relleno sin gate no se acepta: la IA solo entra bajo gate determinista')

  const filled: AiSlotRef[] = []
  const rejected: FlowFillRejection[] = []

  for (const slot of pendingFlowSlots(tree, directory)) {
    const original = tree.read(slot.file, 'utf-8') ?? ''
    const candidate = await executor.propose(buildFlowSlotPrompt(tree, directory, slot), slot, original)

    if (candidate === undefined) {
      rejected.push({ slot, reason: `el ejecutor no propuso nada para '${slot.id}'` })
      continue
    }

    // la frontera barata primero: no se gasta un gate de minutos en algo ya invalidado
    const outsideEdit = validateSlotOnlyEdit(original, candidate, slot.id)
    if (outsideEdit) {
      rejected.push({ slot, reason: outsideEdit })
      continue
    }

    // se escribe SIEMPRE por replaceSlotBody: los bytes de fuera del hueco los pone el
    // acelerador, y así el relleno sobrevive a la regeneración por construcción
    tree.write(slot.file, replaceSlotBody(original, slot.id, readSlotBody(candidate, slot.id) ?? ''))

    const reason = await gate.run(slot)
    if (reason) {
      tree.write(slot.file, original)
      rejected.push({ slot, reason })
      continue
    }

    filled.push(slot)
  }

  return { executor: executor.name, pending: pendingFlowSlots(tree, directory), filled, rejected }
}

/**
 * Comando de relleno de los huecos de paso (spec 39, bloque B). De momento solo
 * recolecta: lista lo pendiente y termina sin escribir. Cuando haya ejecutor, cada
 * hueco pasará su propio gate determinista antes de quedarse en el árbol.
 */
export async function fillFlowSlotsGenerator(tree: Tree, options: FlowFillOptions): Promise<void> {
  if (!tree.exists(options.directory)) {
    throw new Error(`El directorio '${options.directory}' no existe: nada que rellenar`)
  }

  const report = await fillPendingFlowSlots(tree, options)

  for (const { slot, reason } of report.rejected) {
    console.log(`✗ ${slot.id}: ${reason}`)
    console.log('  El hueco vuelve a quedar vacío.')
  }
  for (const slot of report.filled) {
    console.log(`✓ ${slot.id} relleno y aceptado por el gate`)
  }

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
