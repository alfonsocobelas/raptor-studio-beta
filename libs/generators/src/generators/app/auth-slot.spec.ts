import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * TASK-03 (spec 22): auth pasa de plugin aditivo a ranura excluyente. La forma nueva
 * (`--auth=single-tenant`) y la heredada (`--plugins=auth`) deben emitir exactamente
 * lo mismo, y no pedir auth debe seguir dejando la app abierta.
 */
describe('app generator — ranura auth', () => {
  const snapshot = async (options: Parameters<typeof appGenerator>[1]): Promise<Map<string, string>> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    const files = new Map<string, string>()
    for (const change of tree.listChanges()) {
      files.set(change.path, change.content?.toString('utf-8') ?? '')
    }
    return files
  }

  const base = { name: 'demo', models: 'contract', skipInstall: true } as const

  it('auth=single-tenant emite exactamente lo mismo que el heredado plugins=auth', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    const slot = await snapshot({ ...base, auth: 'single-tenant' })
    const legacy = await snapshot({ ...base, plugins: 'auth' })

    expect([...slot.keys()].sort()).toEqual([...legacy.keys()].sort())
    for (const [file, content] of legacy) {
      expect(slot.get(file)).toBe(content)
    }
    warn.mockRestore()
  })

  it('sin pedir auth no se emite el módulo de autenticación', async () => {
    const open = await snapshot(base)

    expect([...open.keys()].some(f => f.includes('contexts/iam/modules/auth'))).toBe(false)
  })

  it('auth=single-tenant con database=mongo falla antes de emitir nada', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    // los 4 ficheros del workspace vacío (nx.json, package.json…) los crea el fixture, no el generador
    const preexisting = tree.listChanges().length

    await expect(appGenerator(tree, { ...base, auth: 'single-tenant', database: 'mongo' })).rejects.toThrow(
      /single-tenant.*requires database=postgres/
    )
    expect(tree.listChanges()).toHaveLength(preexisting)
  })
})
