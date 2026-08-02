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
  if (lines.includes(entry)) return

  const body = current.length && !current.endsWith('\n') ? `${current}\n` : current
  tree.write(NXIGNORE, `${body}${entry}\n`)
}
