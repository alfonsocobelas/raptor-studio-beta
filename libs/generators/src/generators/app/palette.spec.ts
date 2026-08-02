import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { applyPalette } from './palette'

const STYLES = `:root {
  --background: oklch(1 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --ring: oklch(0.708 0 0);
  --sidebar-primary: oklch(0.205 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --ring: oklch(0.556 0 0);
}
`

const STYLES_PATH = 'apps/frontend-app/src/styles.css'

describe('applyPalette — el color elegido en el lienzo llega a la app (spec 18)', () => {
  const withStyles = (): Tree => {
    const tree = createTreeWithEmptyWorkspace()
    tree.write(STYLES_PATH, STYLES)
    return tree
  }

  it('tiñe el color de acción en claro y en oscuro', () => {
    const tree = withStyles()

    applyPalette(tree, '', 'ocean')
    const css = tree.read(STYLES_PATH, 'utf-8') ?? ''

    expect(css).toContain('--primary: oklch(0.55 0.14 235)')
    expect(css).toContain('--primary: oklch(0.72 0.12 236)')
  })

  it('no toca el resto de tokens: una paleta tiñe la acción, no rehace el tema', () => {
    const tree = withStyles()

    applyPalette(tree, '', 'ocean')
    const css = tree.read(STYLES_PATH, 'utf-8') ?? ''

    expect(css).toContain('--background: oklch(1 0 0)')
    expect(css).toContain('--background: oklch(0.145 0 0)')
    expect(css).toContain('--sidebar-primary: oklch(0.205 0 0)')
  })

  it('neutral deja el fichero intacto: es lo que ya se emite', () => {
    const tree = withStyles()

    applyPalette(tree, '', 'neutral')

    expect(tree.read(STYLES_PATH, 'utf-8')).toBe(STYLES)
  })

  it('una paleta desconocida no rompe la generación: se ignora', () => {
    const tree = withStyles()

    expect(() => applyPalette(tree, '', 'fucsia')).not.toThrow()
    expect(tree.read(STYLES_PATH, 'utf-8')).toBe(STYLES)
  })
})
