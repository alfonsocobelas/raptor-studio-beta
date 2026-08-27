import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { registerModels, MODELS } from './models/registry'
import { resourceGenerator } from './resource'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * Spec 38 · TASK-08: el copy del diálogo deja de mentir. Con borrado suave nada se
 * elimina «permanentemente»: se archiva. Si además
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

  it('un padre avisa del arrastre, sin conteos y sin prometer restauración', async () => {
    const list = read(await emit('account'), 'out/frontend/accounts-list.component.ts')

    expect(list).toContain('Se archivará el cliente')
    expect(list).toContain('y sus registros relacionados')
    expect(list).not.toContain('papelera')
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

  /**
   * Defecto cazado por la demo `peritajes` (2026-08-20): el nombre que el diálogo entrecomilla
   * salía siempre de un campo `name`, existiera o no. Un informe de peritación no tiene nombre
   * —se reconoce por su siniestro y su fecha—, así que el emitido no compilaba:
   * «Property 'name' does not exist on type 'InformeDto'». Los cuatro modelos de oro lo tapaban
   * porque todos tienen `name` o lo declaran a mano.
   */
  it('una entidad sin campo name usa el primero por el que se la busca, no uno inventado', async () => {
    // worklog no tiene `name`: se reconoce por el código de su instalación. Sin la declaración
    // a mano, el generador emitía `?.name` igualmente y el emitido no compilaba.
    const sinDeclarar = {
      ...MODELS['worklog'],
      list: { ...MODELS['worklog'].list, deleteLabelField: undefined }
    } as ResourceDefinition

    registerModels([MODELS['account'], MODELS['installation'], sinDeclarar, MODELS['material']])
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'worklog', directory: 'out' })
    const list = read(tree, 'out/frontend/worklogs-list.component.ts')

    expect(list).toContain('deletingWorklog()?.installationCode')
    expect(list).not.toContain('deletingWorklog()?.name')
  })

  it('la ficha usa el mismo copy que el listado', async () => {
    const detail = read(await emit('account'), 'out/frontend/account-detail.component.ts')

    expect(detail).toContain('Se archivará el cliente')
    expect(detail).not.toContain('permanentemente')
  })
})
