import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { registerModels, MODELS } from './models/registry'
import { resourceGenerator } from './resource'

/**
 * Spec 38 · TASK-08: el copy del diálogo deja de mentir. Con borrado suave nada se
 * elimina «permanentemente»: se archiva y se puede restaurar desde la papelera. Si además
 * arrastra hijos, el aviso lo dice — genérico, sin conteos previos (decisión 2). La
 * permanencia solo sobrevive donde es verdad: en las entidades físicas.
 */
describe('resource generator — copy del borrado (spec 38 TASK-08)', () => {
  const emit = async (name: string): Promise<Tree> => {
    registerModels([MODELS['account'], MODELS['installation'], MODELS['worklog'], MODELS['material']])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }
  const read = (tree: Tree, path: string): string => tree.read(path, 'utf-8') ?? ''

  it('un padre avisa del arrastre y de que se puede restaurar, sin conteos', async () => {
    const list = read(await emit('account'), 'out/frontend/accounts-list.component.ts')

    expect(list).toContain('Se archivará el cliente')
    expect(list).toContain('y sus registros relacionados')
    expect(list).toContain('Podrás restaurarlo desde la papelera.')
    expect(list).not.toContain('permanentemente')
  })

  it('una hoja suave se archiva sin mencionar relacionados', async () => {
    const list = read(await emit('worklog'), 'out/frontend/worklogs-list.component.ts')

    expect(list).toContain('Se archivará el parte de trabajo')
    expect(list).not.toContain('y sus registros relacionados')
    expect(list).not.toContain('permanentemente')
  })

  it('la entidad física conserva la permanencia: allí sí es verdad', async () => {
    const list = read(await emit('material'), 'out/frontend/materials-list.component.ts')

    expect(list).toContain('Se eliminará permanentemente el material')
    expect(list).toContain('Esta acción no se puede deshacer.')
  })

  it('la ficha usa el mismo copy que el listado', async () => {
    const detail = read(await emit('account'), 'out/frontend/account-detail.component.ts')

    expect(detail).toContain('Se archivará el cliente')
    expect(detail).not.toContain('permanentemente')
  })
})
