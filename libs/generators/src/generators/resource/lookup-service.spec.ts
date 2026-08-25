import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'

/**
 * Spec 66: el typeahead de referencias busca con una petición PROPIA (page 1,
 * 20 resultados) que no toca el request compartido; y findOne se emite siempre
 * — cualquier recurso puede ser destino de una referencia.
 */
describe('resource generator — lookup del servicio', () => {
  const generate = async (): Promise<Tree> => {
    const model = { ...MODELS['supplier'], detail: undefined, form: undefined }
    registerModels([model])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: model.name, directory: 'out' })
    return tree
  }

  const service = async (): Promise<string> => {
    const tree = await generate()
    return tree.read('out/frontend/supplier.service.ts', 'utf-8') ?? ''
  }

  it('emite lookup(term) con su propia petición de 20 resultados', async () => {
    const emitted = await service()

    expect(emitted).toContain('lookup(search: string)')
    expect(emitted).toContain('pageSize: 20')
    expect(emitted).toContain('.then(page => page.items)')
  })

  it('findOne se emite aunque el recurso no tenga ficha ni página-formulario', async () => {
    const emitted = await service()

    expect(emitted).toContain('findOne(id: string)')
  })
})
