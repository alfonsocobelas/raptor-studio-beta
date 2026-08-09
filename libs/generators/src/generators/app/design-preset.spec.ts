import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * Spec 37: la ranura `design`. Medido en la sesión del 2026-08-09, cambiar de librería de
 * componentes (spartan↔material) dejaba las apps casi indistinguibles: 12 ficheros de ~750, y
 * listado y diálogo IDÉNTICOS byte a byte. La variedad visual no vive en la librería sino en el
 * SHELL y en la densidad, así que se parametrizan esos.
 *
 * Tres presets: `actual` (el de siempre, por defecto), `cabina` (centro de operaciones denso,
 * con tema claro y oscuro) y `suite` (ERP con banda de marca y pestañas de módulo).
 */
describe('app generator — ranura design (spec 37)', () => {
  const emit = async (options: Parameters<typeof appGenerator>[1]): Promise<Map<string, string>> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    const files = new Map<string, string>()
    for (const change of tree.listChanges()) {
      files.set(change.path, change.content?.toString('utf-8') ?? '')
    }
    return files
  }

  const base = { name: 'demo', models: 'customer', skipInstall: true } as const
  const SHELL = 'apps/demo/apps/frontend-app/src/app.component.ts'
  const STYLES = 'apps/demo/apps/frontend-app/src/styles.css'

  it('sin pedir diseño se emite exactamente lo mismo que antes de existir la ranura', async () => {
    const implicit = await emit(base)
    const explicit = await emit({ ...base, design: 'actual' })

    expect([...implicit.keys()].sort()).toEqual([...explicit.keys()].sort())
    for (const [file, content] of explicit) {
      expect(implicit.get(file)).toBe(content)
    }
  })

  it('cabina emite su propio shell, denso y con la barra lateral por tokens del preset', async () => {
    const shell = (await emit({ ...base, design: 'cabina' })).get(SHELL) ?? ''

    expect(shell).toContain('app-shell-side')
    // el contador por recurso es lo que distingue a un centro de operaciones de un menú
    expect(shell).toContain('navItems')
    expect(shell).not.toContain('Panel de gestión')
  })

  it('cabina trae los dos temas: la piel no impone modo oscuro fijo', async () => {
    const styles = (await emit({ ...base, design: 'cabina' })).get(STYLES) ?? ''

    // el bloque del preset define su cromo en AMBOS temas, no solo en oscuro
    expect(styles).toContain('--shell-bg')
    expect(styles).toMatch(/\.dark[\s\S]*--shell-bg/)
  })

  it('suite emite banda de marca y pestañas de módulo en vez de barra lateral', async () => {
    const shell = (await emit({ ...base, design: 'suite' })).get(SHELL) ?? ''

    expect(shell).toContain('app-shell-banner')
    expect(shell).toContain('app-shell-modules')
    expect(shell).not.toContain('app-shell-side')
  })

  it('un diseño desconocido falla antes de emitir nada', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const preexisting = tree.listChanges().length

    await expect(appGenerator(tree, { ...base, design: 'brutalista' })).rejects.toThrow(/design/i)
    expect(tree.listChanges()).toHaveLength(preexisting)
  })
})
