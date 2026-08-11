import { names } from '@nx/devkit'
import type { BusinessFlow, FlowNode } from '@acc/schema'
import { bfsOrder } from './brief-doc'

/**
 * Derivación de la clase de proceso que emite un flujo (spec 39). El flujo NO se
 * ejecuta (regla 7): la clase es una coreografía documentada — cada método es un punto
 * de entrada independiente y la secuencia vive solo en el JSDoc. Toda la lógica está
 * aquí (regla 8): la plantilla solo interpola.
 */
export interface FlowProcessNames {
  /** Carpeta y fichero: nombre del flujo en kebab sin acentos ('de-presupuesto-a-legalizacion') */
  fileName: string
  /** Clase emitida: PascalCase + sufijo ('DePresupuestoALegalizacionProcess') */
  className: string
}

export interface FlowStepMethod {
  /** Id del nodo en camelCase ('planifica-montaje' → 'planificaMontaje') */
  methodName: string
  node: FlowNode
}

export function flowProcessNames(flow: BusinessFlow): FlowProcessNames {
  const plain = stripDiacritics(flow.name)
  return {
    fileName: names(plain).fileName,
    className: `${names(plain).className}Process`
  }
}

/** Solo los nodos `step` derivan método, en orden BFS (el mismo del mapa del CLAUDE.md). */
export function flowStepMethods(flow: BusinessFlow): FlowStepMethod[] {
  return bfsOrder(flow)
    .filter(node => node.kind === 'step')
    .map(node => ({ methodName: names(node.id).propertyName, node }))
}

/** «legalización» → 'legalizacion': el nombre del flujo es prosa; el fichero, ASCII. */
function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}
