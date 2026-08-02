import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'
import { MODELS, registerModels } from './models/registry'
import type { ResourceDefinition } from '@acc/schema'

describe('resource generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('throws a helpful error for an unknown model', async () => {
    await expect(resourceGenerator(tree, { name: 'nonexistent' })).rejects.toThrow(
      "Unknown resource model 'nonexistent'"
    )
  })

  it('expands the templates for a registered model into the default output dir', async () => {
    // WHEN
    await resourceGenerator(tree, { name: 'contract' })

    // THEN — the golden-diff working area receives the expanded templates
    const generated = tree.children('tmp/generated/contracts')
    expect(generated.length).toBeGreaterThan(0)
  })

  it('respects an explicit output directory', async () => {
    await resourceGenerator(tree, { name: 'contract', directory: 'tmp/probe' })

    expect(tree.children('tmp/probe').length).toBeGreaterThan(0)
  })
})

/**
 * Defecto 18 (visto en motorhub): los tests emitidos pluralizaban a mano
 * `<className>s` y producían «ExportReparacionsUseCase» cuando la clase real es
 * «ExportReparacionesUseCase». El plural del modelo es dato, no se inventa.
 */
describe('resource generator — plural en los tests emitidos', () => {
  it('usa el plural declarado, no className + s', async () => {
    const reparacion = {
      ...MODELS['supplier'],
      name: 'reparacion',
      plural: 'reparaciones',
      labels: { singular: 'Reparación', plural: 'Reparaciones' }
    } as ResourceDefinition
    registerModels([reparacion])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'reparacion', directory: 'out' })

    const search = tree.read('out/backend-tests-application/search-reparaciones-usecase.test.ts', 'utf-8') ?? ''
    const exportTest = tree.read('out/backend-tests-application/export-reparaciones-usecase.test.ts', 'utf-8') ?? ''

    expect(search).toContain('SearchReparacionesUseCase')
    expect(search).not.toContain('SearchReparacionsUseCase')
    expect(exportTest).toContain('ExportReparacionesUseCase')
    expect(exportTest).not.toContain('ExportReparacionsUseCase')
  })
})
