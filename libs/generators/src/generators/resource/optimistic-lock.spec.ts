import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'
import { MODELS, registerModels } from './models/registry'

/**
 * Spec 78: bloqueo optimista por defecto. El agregado emitido transporta `version`
 * como propiedad plana (create=1, fromPrimitives, toPrimitives); el contador lo
 * incrementa el repositorio al persistir, nunca el dominio.
 */
describe('resource generator — bloqueo optimista (dominio)', () => {
  const generate = async (name: string): Promise<Tree> => {
    registerModels([MODELS[name]])
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }

  it('el agregado transporta version: ctor, getter, create=1 y primitives', async () => {
    const tree = await generate('customer')
    const aggregate = tree.read('out/backend/domain/customer.ts', 'utf-8') ?? ''

    expect(aggregate).toContain('private readonly _version: number')
    expect(aggregate).toContain('get version(): number')
    expect(aggregate).toContain('version: this._version')
    expect(aggregate).toContain('props.version')
  })

  it('toda entidad nueva nace con version 1 y el dominio no la incrementa', async () => {
    const tree = await generate('customer')
    const aggregate = tree.read('out/backend/domain/customer.ts', 'utf-8') ?? ''

    // register() delega en create() y create() fija la versión inicial
    expect(aggregate).toMatch(/static create\([\s\S]*?\n\s*1[,\n]/)
    expect(aggregate).not.toContain('this._version =')
    expect(aggregate).not.toContain('_version++')
  })

  it('el builder de tests emitido arranca las primitivas con version: 1', async () => {
    const tree = await generate('customer')
    const builder = tree.read('out/backend-tests/customer.builder.ts', 'utf-8') ?? ''

    expect(builder).toContain('version: 1')
  })

  it('los PrimitiveProps declaran version: number y los AggregateProps no', async () => {
    const tree = await generate('customer')
    const types = tree.read('out/backend/domain/customer-types.ts', 'utf-8') ?? ''

    expect(types).toMatch(/CustomerPrimitiveProps[\s\S]*?version: number/)
    const aggregateProps = types.match(/type CustomerAggregateProps[\s\S]*?\n}/)?.[0] ?? ''
    expect(aggregateProps).not.toContain('version')
  })
})
