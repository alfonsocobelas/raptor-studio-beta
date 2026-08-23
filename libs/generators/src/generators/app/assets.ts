import type { Tree } from '@nx/devkit'
import * as fs from 'fs'
import * as path from 'path'

/**
 * Copia un árbol de assets sin pasarlo por EJS (el esqueleto es literal) quitando
 * el sufijo `.template`, que solo existe para que el build del plugin no lo compile.
 *
 * `omit` filtra por ruta relativa a la raíz copiada ('iac', 'iac/main.tf', …): se filtra
 * al copiar, no se borra después — el árbol nunca tiene los ficheros descartados.
 */
export function copyVerbatim(tree: Tree, from: string, to: string, omit?: (relativePath: string) => boolean): void {
  copySubtree(tree, from, to, '', omit)
}

function copySubtree(
  tree: Tree,
  from: string,
  to: string,
  relative: string,
  omit?: (relativePath: string) => boolean
): void {
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name)
    const relativePath = relative ? `${relative}/${entry.name}` : entry.name
    if (omit?.(relativePath)) {
      continue
    }
    if (entry.isDirectory()) {
      copySubtree(tree, source, path.join(to, entry.name), relativePath, omit)
      continue
    }
    tree.write(path.join(to, entry.name.replace(/\.template$/, '')), fs.readFileSync(source))
  }
}
