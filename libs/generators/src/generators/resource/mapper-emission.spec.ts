import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import resourceGenerator from './resource'

/**
 * TASK-02 (spec 26): el mapper se emite SIEMPRE.
 *
 * `skipEmit: ['mapper']` mezclaba dos cosas: «no compares este fichero en el golden» (lo que quiere
 * el canon, porque el mapper de la referencia lleva la composición resuelta a mano) y «no lo
 * emitas», que es lo que hacía — dejando al repositorio emitido importando un fichero inexistente.
 * Lo primero es cosa del gate; lo segundo era un bug.
 */
describe('resource generator — el mapper se emite siempre', () => {
  const emit = async (name: string): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }

  it('emite el mapper de customer, que antes lo omitía', async () => {
    const tree = await emit('customer')

    expect(tree.exists('out/backend/infrastructure/persistence/typeorm/customer.mapper.ts')).toBe(true)
  })

  it('emite el mapper de license, que antes lo omitía', async () => {
    const tree = await emit('license')

    expect(tree.exists('out/backend/infrastructure/persistence/typeorm/license.mapper.ts')).toBe(true)
  })

  it('el repositorio emitido puede importarlo: existe lo que importa', async () => {
    const tree = await emit('customer')
    const repository =
      tree.read('out/backend/infrastructure/persistence/typeorm/typeorm-customer.repository.ts', 'utf-8') ?? ''

    expect(repository).toContain("from './customer.mapper'")
    expect(tree.exists('out/backend/infrastructure/persistence/typeorm/customer.mapper.ts')).toBe(true)
  })
})
