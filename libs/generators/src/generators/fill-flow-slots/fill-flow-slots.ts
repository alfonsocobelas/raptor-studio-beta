import { readFileSync } from 'node:fs'
import { basename } from 'node:path'
import type { Tree } from '@nx/devkit'
import { type AiSlotRef, harvestAiSlots, listEmptyAiSlots, readSlotBody, replaceSlotBody } from '../resource/ai-slots'
import { bridgeSlotExecutor } from './bridge-executor'
import { emittedAppGate } from './gate'
import { buildFlowSlotPrompt } from './prompt'
import { validateSlotOnlyEdit } from './slot-write'

/** Prefijo de los huecos que emite un flujo: `// @ai:begin flow-<nodeId>` */
const FLOW_PREFIX = 'flow-'

/** Presupuesto por hueco: la propuesta y una sola segunda oportunidad (spec 75) */
const PROPOSALS_PER_SLOT = 2

/** El segundo intento lleva el motivo del rechazo: sin él la IA repetiría el error. */
function promptWithRejection(basePrompt: string, reason: string): string {
  return [
    basePrompt,
    '',
    'Tu intento anterior fue rechazado por el gate determinista. Motivo:',
    reason,
    'Corrige exactamente ese problema sin repetir el error. Sigue las mismas reglas.'
  ].join('\n')
}

export interface FillFlowSlotsGeneratorSchema {
  /** Directorio de la app ya emitida sobre la que se rellena (p.ej. apps/solaris) */
  directory: string
  /** Un solo hueco por su id (`flow-cie`): una prueba real no cuesta cinco gates */
  slot?: string
  /** Directorio del puente donde espera la petición; sin él no hay ejecutor */
  bridge?: string
  /** Modo reparación (spec 75): re-propone huecos YA rellenos implicados en un informe */
  repair?: boolean
  /** Ruta al fichero con la salida del fallo de validación (obligatorio con repair) */
  report?: string
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

/**
 * El gate determinista de un hueco. Recibe el contenido ya relleno porque compilar es
 * una operación de disco y el árbol de Nx no se vuelca hasta el final del generador.
 * Devuelve el motivo del rechazo, o nada si pasa.
 */
export interface SlotGate {
  run(slot: AiSlotRef, content: string): Promise<string | undefined>
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
  /** Motivo si la app YA estaba en rojo antes de rellenar: no se intenta nada */
  baseline?: string
  /** Huecos de paso que siguen vacíos, en orden de recorrido del árbol */
  pending: AiSlotRef[]
  /** Huecos rellenados y aceptados por el gate */
  filled: AiSlotRef[]
  /** Huecos que se intentaron y no pasaron, con el motivo */
  rejected: FlowFillRejection[]
}

/** Los huecos de paso que siguen sin cuerpo en una app emitida. */
export function pendingFlowSlots(tree: Tree, directory: string, slotId?: string): AiSlotRef[] {
  const pending = listEmptyAiSlots(tree, directory, FLOW_PREFIX)

  return slotId ? pending.filter(slot => slot.id === slotId) : pending
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
    pending: pendingFlowSlots(tree, options.directory, options.slot),
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

  const pending = pendingFlowSlots(tree, directory, options.slot)

  // línea base: si la app ya está roja, el gate de cada hueco reportaría el error de un
  // fichero que nadie tocó y parecería culpa del relleno (visto en la corrida real de
  // solaris, con un VO compartido colgando). Se mide una vez y se para.
  if (pending.length) {
    const baseline = await gate.run(pending[0], tree.read(pending[0].file, 'utf-8') ?? '')
    if (baseline) {
      return { executor: executor.name, baseline, pending, filled: [], rejected: [] }
    }
  }

  const { filled, rejected } = await proposeAndGateSlots(tree, pending, {
    executor,
    gate,
    promptFor: slot => buildFlowSlotPrompt(tree, directory, slot)
  })

  return { executor: executor.name, pending: pendingFlowSlots(tree, directory), filled, rejected }
}

interface SlotProposalContext {
  executor: SlotExecutor
  gate: SlotGate
  promptFor(slot: AiSlotRef): string
}

/**
 * El bucle de propuestas bajo gate, común al relleno y a la reparación. Presupuesto de
 * 2 propuestas por hueco (spec 75): un rechazo (frontera o gate) da UNA segunda
 * oportunidad con el motivo en el prompt; el segundo rechazo es definitivo. Si el gate
 * rechaza, el fichero se restaura a como estaba al entrar (vacío en el relleno, el
 * cuerpo anterior en la reparación): nunca se deja peor.
 */
async function proposeAndGateSlots(
  tree: Tree,
  slots: AiSlotRef[],
  { executor, gate, promptFor }: SlotProposalContext
): Promise<{ filled: AiSlotRef[]; rejected: FlowFillRejection[] }> {
  const filled: AiSlotRef[] = []
  const rejected: FlowFillRejection[] = []

  for (const slot of slots) {
    const original = tree.read(slot.file, 'utf-8') ?? ''
    const basePrompt = promptFor(slot)
    let lastReason: string | undefined
    let accepted = false

    for (let attempt = 0; attempt < PROPOSALS_PER_SLOT && !accepted; attempt++) {
      // la obra traduce esta línea a «proponiendo…» (spec 45): sin ella, el puente espera
      // hasta 15 minutos en silencio y la pantalla parece colgada
      console.log(`→ ${slot.id}: proponiendo por ${executor.name}…`)
      const prompt = lastReason ? promptWithRejection(basePrompt, lastReason) : basePrompt
      const candidate = await executor.propose(prompt, slot, original)

      if (candidate === undefined) {
        // sin propuesta no hay motivo que devolverle a la IA: no se reintenta
        lastReason = `el ejecutor no propuso nada para '${slot.id}'`
        break
      }

      // la frontera barata primero: no se gasta un gate de minutos en algo ya invalidado
      const outsideEdit = validateSlotOnlyEdit(original, candidate, slot.id)
      if (outsideEdit) {
        lastReason = outsideEdit
        continue
      }

      // se escribe SIEMPRE por replaceSlotBody: los bytes de fuera del hueco los pone el
      // acelerador, y así el relleno sobrevive a la regeneración por construcción
      const written = replaceSlotBody(original, slot.id, readSlotBody(candidate, slot.id) ?? '')
      tree.write(slot.file, written)

      const reason = await gate.run(slot, written)
      if (reason) {
        tree.write(slot.file, original)
        lastReason = reason
        continue
      }

      accepted = true
    }

    if (accepted) {
      filled.push(slot)
    } else {
      rejected.push({ slot, reason: lastReason ?? `el ejecutor no propuso nada para '${slot.id}'` })
    }
  }

  return { filled, rejected }
}

export interface FlowRepairOptions extends FlowFillOptions {
  /** La salida del fallo de validación, ya leída: decide qué huecos están implicados */
  reportContent: string
}

/**
 * Los huecos flow-* YA rellenos cuyo fichero cita el informe de validación. La cita es
 * por basename: suficiente para acotar, y un falso positivo solo gasta una propuesta
 * (el gate por hueco impide empeorar).
 */
export function implicatedFilledFlowSlots(tree: Tree, directory: string, reportContent: string): AiSlotRef[] {
  const implicated: AiSlotRef[] = []

  for (const [file, slots] of harvestAiSlots(tree, directory)) {
    if (!reportContent.includes(basename(file))) continue
    for (const id of slots.keys()) {
      if (id.startsWith(FLOW_PREFIX)) implicated.push({ file, id })
    }
  }

  return implicated
}

/** El prompt de reparación: el del hueco más el informe del fallo que lo implica. */
function promptWithValidationReport(basePrompt: string, report: string): string {
  return [
    basePrompt,
    '',
    'La validación global de la app ha fallado y este hueco (ya relleno) está implicado.',
    'Informe del fallo:',
    report,
    'Repara el cuerpo del hueco para que la validación pase, sin tocar nada fuera de él.'
  ].join('\n')
}

/**
 * Modo reparación (spec 75): re-propone SOLO los huecos rellenos implicados en el
 * informe. Sin huecos implicados no se toca nada — el fallo es del código canónico y
 * se arregla en el generador (test rojo + golden), nunca a mano. No hay línea base:
 * la app ya se sabe roja, es la premisa de entrada.
 */
export async function repairFilledFlowSlots(tree: Tree, options: FlowRepairOptions): Promise<FlowFillReport> {
  const { directory, executor, gate, reportContent } = options

  if (!executor) return flowFillReport(tree, options)
  if (!gate) throw new Error('Una reparación sin gate no se acepta: la IA solo entra bajo gate determinista')

  const implicated = implicatedFilledFlowSlots(tree, directory, reportContent)
  const { filled, rejected } = await proposeAndGateSlots(tree, implicated, {
    executor,
    gate,
    promptFor: slot => promptWithValidationReport(buildFlowSlotPrompt(tree, directory, slot), reportContent)
  })

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

  // con puente hay ejecutor, y donde hay ejecutor hay gate: los dos o ninguno
  const wired: FlowFillOptions = options.bridge
    ? {
        ...options,
        executor: options.executor ?? bridgeSlotExecutor(options.bridge),
        gate: options.gate ?? emittedAppGate(options.directory)
      }
    : options

  if (options.repair) {
    if (!options.report) {
      throw new Error('La reparación necesita --report con la ruta del informe del fallo de validación')
    }
    // el informe suele vivir dentro del workspace (tmp/), pero un tmpfile del sistema
    // queda fuera del árbol de Nx: se intenta el árbol y se cae al disco
    const reportContent = tree.exists(options.report)
      ? (tree.read(options.report, 'utf-8') ?? '')
      : readFileSync(options.report, 'utf-8')
    const repair = await repairFilledFlowSlots(tree, { ...wired, reportContent })

    if (!repair.filled.length && !repair.rejected.length) {
      console.log('Sin huecos IA implicados en el informe: el fallo es del código canónico y se arregla en el generador.')
      return
    }
    for (const { slot, reason } of repair.rejected) {
      console.log(`✗ ${slot.id}: ${reason}`)
      console.log('  El hueco conserva su cuerpo anterior.')
    }
    for (const slot of repair.filled) {
      console.log(`✓ ${slot.id} relleno y aceptado por el gate`)
    }
    return
  }

  const report = await fillPendingFlowSlots(tree, wired)

  if (report.baseline) {
    console.log(`✗ La app ya estaba en rojo ANTES de rellenar, así que no se ha intentado nada:\n${report.baseline}`)
    return
  }

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
