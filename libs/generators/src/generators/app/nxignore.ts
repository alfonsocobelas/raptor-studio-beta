import type { Tree } from '@nx/devkit'

const NXIGNORE = '.nxignore'

/**
 * La app emitida es un workspace Nx ANIDADO (trae su nx.json y sus libs de UI).
 * Si el workspace padre la escanea, dos apps generadas colisionan por nombre de
 * proyecto —`table`, `button`, `utils`…— y el grafo revienta, bloqueando
 * cualquier generación posterior. Registrarla en .nxignore lo evita.
 */
export function ignoreNestedWorkspace(tree: Tree, root: string): void {
  const entry = root.replace(/\/+$/, '')
  if (!entry) return

  const current = tree.read(NXIGNORE, 'utf-8') ?? ''
  const lines = current.split('\n').map(line => line.trim())
  if (lines.some(line => covers(line, entry))) return

  const body = current.length && !current.endsWith('\n') ? `${current}\n` : current
  tree.write(NXIGNORE, `${body}${entry}\n`)
}

/**
 * ¿La línea ya cubre la ruta? Literal, o patrón con `*` (que no cruza `/`, como
 * en gitignore). Un directorio ignorado cubre todo lo que cuelga de él — por eso
 * `tmp/generated-*` tapa `tmp/generated-83014/app-golden` y el gate de oro deja
 * de añadir dos líneas por corrida.
 */
function covers(line: string, entry: string): boolean {
  if (!line || line.startsWith('#')) return false
  if (line === entry) return true
  if (!line.includes('*')) return entry.startsWith(`${line}/`)

  const pattern = line
    .split('*')
    .map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*')
  return new RegExp(`^${pattern}(/.*)?$`).test(entry)
}
