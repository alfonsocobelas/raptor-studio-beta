import type { Tree } from '@nx/devkit'
import { findTheme } from '@acc/schema'
import * as path from 'path'

const STYLES = 'apps/frontend-app/src/styles.css'

/** Tokens teñidos por la paleta; el resto del tema se queda como está. */
const TINTED = ['--primary', '--primary-foreground', '--ring'] as const

/**
 * Aplica la paleta declarada al styles.css ya emitido (spec 18). El fichero se
 * copia literal desde el esqueleto (no pasa por EJS), así que la paleta se
 * aplica después, reescribiendo solo las líneas de los tokens teñidos: la
 * primera aparición es el bloque claro y la segunda el bloque `.dark`.
 *
 * Una paleta desconocida se ignora en vez de romper: el gate del schema ya la
 * habrá rechazado antes, y aquí un fallo dejaría media app generada.
 */
export function applyPalette(tree: Tree, root: string, paletteId: string | undefined): void {
  if (!paletteId || paletteId === 'neutral') return

  const palette = findTheme(paletteId)
  if (!palette) return

  const file = path.join(root, STYLES)
  const css = tree.read(file, 'utf-8')
  if (!css) return

  const values: Record<(typeof TINTED)[number], [string, string]> = {
    '--primary': [palette.light.primary, palette.dark.primary],
    '--primary-foreground': [palette.light.primaryForeground, palette.dark.primaryForeground],
    '--ring': [palette.light.ring, palette.dark.ring]
  }

  let tinted = css
  for (const token of TINTED) {
    const [light, dark] = values[token]
    let seen = 0
    // \b evita que --primary capture también --primary-foreground o --sidebar-primary
    tinted = tinted.replace(new RegExp(`(^\\s*)${token}(\\s*):([^;\\n]*)`, 'gm'), (match, indent: string, gap: string) => {
      seen += 1
      if (seen > 2) return match
      return `${indent}${token}${gap}: ${seen === 1 ? light : dark}`
    })
  }

  tree.write(file, tinted)
}
