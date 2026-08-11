import type { Tree } from '@nx/devkit'
import { stripAiSlots } from '../resource/ai-slots'

export interface StripAiSlotsGeneratorSchema {
  /** Directorio de la app generada a entregar (p.ej. apps/solaris) */
  directory: string
}

/**
 * Paso de entrega (opt-in, un solo sentido): borra las líneas `@ai:begin/@ai:end`
 * de la app generada conservando lo escrito dentro. Tras esto, la copia queda
 * fuera del ciclo de regeneración — nunca forma parte de `nx g app`.
 */
export async function stripAiSlotsGenerator(tree: Tree, options: StripAiSlotsGeneratorSchema) {
  if (!tree.exists(options.directory)) {
    throw new Error(`El directorio '${options.directory}' no existe: nada que entregar`)
  }

  stripAiSlots(tree, options.directory)
}

export default stripAiSlotsGenerator
