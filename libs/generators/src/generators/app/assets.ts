import type { Tree } from '@nx/devkit'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Copia un árbol de assets sin pasarlo por EJS (el esqueleto es literal) quitando
 * el sufijo `.template`, que solo existe para que el build del plugin no lo compile.
 */
export function copyVerbatim(tree: Tree, from: string, to: string): void {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name)
    if (entry.isDirectory()) {
      copyVerbatim(tree, source, path.join(to, entry.name))
      continue
    }
    tree.write(path.join(to, entry.name.replace(/\.template$/, '')), fs.readFileSync(source))
  }
}
