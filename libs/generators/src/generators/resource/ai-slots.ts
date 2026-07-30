import { type Tree, visitNotIgnoredFiles } from '@nx/devkit'

/**
 * Huecos para la IA/mano (§7 del maestro): las plantillas emiten pares
 * `// @ai:begin <id>` … `// @ai:end` en los puntos de extensión canónicos.
 * Lo escrito dentro sobrevive a la regeneración: se cosecha del árbol antes
 * de regenerar y se reinyecta en el hueco homónimo del fichero regenerado.
 * El radio de acción queda acotado a los marcadores; el gate (compilar +
 * tests + diff de oro) sigue siendo quien acepta el resultado, no la IA.
 */
export type AiSlotHarvest = Map<string, Map<string, string>>

const SLOT_REGEX = /^([ \t]*\/\/ @ai:begin ([\w-]+)[^\n]*\n)([\s\S]*?)(^[ \t]*\/\/ @ai:end)/gm

export function harvestAiSlots(tree: Tree, dir: string): AiSlotHarvest {
  const harvest: AiSlotHarvest = new Map()

  if (!tree.exists(dir)) return harvest

  visitNotIgnoredFiles(tree, dir, file => {
    const content = tree.read(file, 'utf-8')
    if (!content || !content.includes('// @ai:begin')) return

    const slots = new Map<string, string>()
    for (const match of content.matchAll(SLOT_REGEX)) {
      const [, , id, body] = match
      if (body.trim() !== '') slots.set(id, body)
    }
    if (slots.size) harvest.set(file, slots)
  })

  return harvest
}

export function reinjectAiSlots(tree: Tree, dir: string, harvest: AiSlotHarvest): void {
  for (const [file, slots] of harvest) {
    if (!tree.exists(file)) continue

    let content = tree.read(file, 'utf-8') ?? ''
    let touched = false

    content = content.replace(
      SLOT_REGEX,
      (whole, beginLine: string, id: string, body: string, endLine: string) => {
        const kept = slots.get(id)
        // solo se rellena un hueco vacío: si el regenerado ya trae contenido, se respeta
        if (!kept || body.trim() !== '') return whole

        touched = true
        return `${beginLine}${kept}${endLine}`
      }
    )

    if (touched) tree.write(file, content)
  }
}
