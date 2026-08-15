import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 43 TASK-07: el VO del campo promovido a estado gana semántica — la factoría del
 * valor inicial, una por valor y un predicado por valor. Así el agregado y los casos de
 * uso hablan en verbos (`isTerminated()`) y no comparan strings pelados.
 */
describe('el VO enum promovido a estado', () => {
  const emit = async (name: string): Promise<Tree> => {
    const tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name, directory: 'out' })
    return tree
  }

  const statusVo = (tree: Tree): string =>
    tree.read('out/backend/domain/value-objects/contract-status.vo.ts', 'utf-8') ?? ''

  it('gana la factoría del valor inicial declarado en la máquina', async () => {
    const source = statusVo(await emit('contract'))

    expect(source).toContain('static initial(): ContractStatus {')
    expect(source).toContain("return new ContractStatus('active')")
  })

  it('gana una factoría semántica por valor del enum', async () => {
    const source = statusVo(await emit('contract'))

    for (const value of ['active', 'expiring', 'expired', 'terminated']) {
      expect(source).toContain(`static ${value}(): ContractStatus {`)
      expect(source).toContain(`return new ContractStatus('${value}')`)
    }
  })

  it('gana un predicado por valor', async () => {
    const source = statusVo(await emit('contract'))

    expect(source).toContain('isActive(): boolean {')
    expect(source).toContain("return this.value === 'terminated'")
  })

  it('un enum SIN máquina queda como estaba: ni factorías ni predicados', async () => {
    const tree = await emit('contract')
    const source = tree.read('out/backend/domain/value-objects/contract-type.vo.ts', 'utf-8') ?? ''

    expect(source).not.toContain('static initial()')
    expect(source).not.toContain('isCloud()')
  })
})
