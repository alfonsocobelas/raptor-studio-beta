import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'
import { MODELS, registerModels } from '../resource/models/registry'
import type { ResourceDefinition } from '@raptor/schema'

/**
 * TASK-03 (spec 25): los adjuntos emiten hoy una entidad TypeORM, así que pedirlos en una app
 * Mongo metería TypeORM donde el candado de la spec 23 lo prohíbe. Se falla ANTES de emitir nada,
 * con un mensaje que dice qué hacer — no se emite una app que no compila.
 */
describe('app generator — adjuntos y motor de persistencia', () => {
  beforeAll(() => {
    registerModels([
      { ...MODELS['supplier'], name: 'invoice', plural: 'invoices', attachments: true } as ResourceDefinition
    ])
  })

  const generate = async (database?: 'postgres' | 'mongo'): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'invoice', skipInstall: true, database })
    return tree
  }

  it('con postgres emite la pieza de adjuntos', async () => {
    const tree = await generate('postgres')

    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/warehouse/modules/invoices/infrastructure/attachments')
    ).toBe(true)
  })

  it('con mongo falla nombrando el modelo culpable y la salida', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()

    await expect(
      appGenerator(tree, { name: 'demo', models: 'invoice', skipInstall: true, database: 'mongo' })
    ).rejects.toThrow(/Attachments on 'invoice' need a persistence engine that emits them \(postgres\).*targets mongo/)
  })

  it('con mongo no deja ni un fichero escrito', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const preexisting = tree.listChanges().length

    await expect(
      appGenerator(tree, { name: 'demo', models: 'invoice', skipInstall: true, database: 'mongo' })
    ).rejects.toThrow()

    expect(tree.listChanges()).toHaveLength(preexisting)
  })

  it('un modelo sin adjuntos sigue funcionando con mongo', async () => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, database: 'mongo' })

    expect(tree.exists('apps/demo/package.json')).toBe(true)
  })
})
