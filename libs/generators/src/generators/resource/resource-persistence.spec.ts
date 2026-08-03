import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * TASK-07 (spec 23): la persistencia POR RECURSO también la manda el manifiesto del motor.
 * Hasta ahora las plantillas TypeORM vivían dentro del árbol que se emite siempre, así que
 * una app mongo se llevaba entidades y repositorios TypeORM además de su kernel Mongoose.
 */
describe('resource generator — persistencia por motor', () => {
  const emit = async (database?: 'postgres' | 'mongo'): Promise<string[]> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'customer', directory: 'out', database })
    return tree.listChanges().map(change => change.path)
  }

  it('postgres emite la entidad, el mapper y el repositorio TypeORM del recurso', async () => {
    const files = await emit('postgres')

    expect(files).toContain('out/backend/infrastructure/persistence/typeorm/typeorm-customer.entity.ts')
    expect(files).toContain('out/backend/infrastructure/persistence/typeorm/typeorm-customer.repository.ts')
    // la entidad del hijo de composición sale del árbol de composición, también por motor
    expect(files).toContain('out/backend/infrastructure/persistence/typeorm/typeorm-contact.entity.ts')
    expect(files).toContain('out/backend-tests-integration/typeorm-customer.repository.test.ts')
  })

  it('omitir la opción equivale a postgres', async () => {
    expect(await emit()).toEqual(await emit('postgres'))
  })

  it('mongo no emite NADA de TypeORM por recurso', async () => {
    const files = await emit('mongo')

    expect(files.filter(f => f.toLowerCase().includes('typeorm'))).toEqual([])
  })

  it('mongo avisa de que su persistencia por recurso está pendiente en vez de callar', async () => {
    // el hueco se ve: mejor un aviso explícito que una app a la que le falta el repositorio en silencio
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    await emit('mongo')

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('mongo'))
    warn.mockRestore()
  })
})
