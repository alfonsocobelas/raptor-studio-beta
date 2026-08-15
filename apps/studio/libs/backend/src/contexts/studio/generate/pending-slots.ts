import { readdirSync, readFileSync, statSync } from 'fs'
import * as path from 'path'

/**
 * Los huecos `flow-*` que quedaron vacíos en una app emitida (spec 45): el desenlace de
 * la obra los cuenta y ofrece rellenarlos. Escáner de DISCO a propósito — el generador ya
 * terminó y aquí no hay Tree de nx; la forma del hueco es el contrato estable de ai-slots
 * (spec 39): `// @ai:begin flow-<id> …` y `// @ai:end` sin nada más que espacio en medio.
 */
const EMPTY_FLOW_SLOT = /\/\/ @ai:begin (flow-[a-z0-9-]+)[^\n]*\n\s*\/\/ @ai:end/g

export function pendingFlowSlotIds(root: string): string[] {
  const ids: string[] = []
  for (const file of processFiles(root)) {
    const source = readFileSync(file, 'utf-8')
    for (const match of source.matchAll(EMPTY_FLOW_SLOT)) {
      ids.push(match[1])
    }
  }
  return ids
}

/** Solo los ficheros de proceso: los huecos de paso no viven en ningún otro sitio. */
function processFiles(root: string): string[] {
  const found: string[] = []
  const walk = (dir: string): void => {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }
    for (const entry of entries) {
      if (entry === 'node_modules' || entry.startsWith('.')) continue
      const full = path.join(dir, entry)
      const info = statSync(full)
      if (info.isDirectory()) walk(full)
      else if (entry.endsWith('.process.ts')) found.push(full)
    }
  }
  walk(root)
  return found.sort()
}
