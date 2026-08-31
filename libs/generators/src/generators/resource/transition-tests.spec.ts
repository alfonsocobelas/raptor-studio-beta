import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 80: las transiciones se emitían SIN test, que es justo al revés de lo que conviene —
 * el CRUD, que apenas tiene reglas, estaba cubierto, y la lógica con guardas (estado de origen
 * legal, versión fresca) iba sin red. Aquí se fija qué afirma el test emitido de cada verbo.
 */
describe('el test emitido de una transición', () => {
  let tree: Tree
  const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''
  const terminate = (): string => read('backend-tests-application/terminate-contract-usecase.test.ts')

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
  })

  it('emite un fichero de test por transición, junto a los del CRUD', () => {
    expect(terminate()).toContain("describe('TerminateContractUseCase'")
    expect(read('backend-tests-application/expire-contract-usecase.test.ts')).toContain(
      "describe('ExpireContractUseCase'"
    )
  })

  it('reusa la mother y el repository mock ya emitidos, como sus vecinos del CRUD', () => {
    const test = terminate()

    expect(test).toContain("import { ContractMother } from '../../domain/mothers/contract.mother'")
    expect(test).toContain("import { ContractRepositoryMock } from '../../mocks/contract.repository.mock'")
    expect(test).toContain('new TerminateContractUseCase(repositoryMock)')
  })

  it('fija que un id inexistente no guarda nada', () => {
    const test = terminate()

    expect(test).toContain('repositoryMock.givenNotFound()')
    expect(test).toMatch(/rejects\.toThrow\(EntityNotFoundError\)/)
    expect(test).toContain("repositoryMock.assertNotCalled('save')")
  })

  it('fija el bloqueo optimista: versión vieja, ni muta ni guarda (spec 78)', () => {
    expect(terminate()).toMatch(/version: 99[\s\S]{0,120}rejects\.toThrow\(\s*ConcurrencyConflictError/)
  })

  it('fija el camino legal: desde un estado de origen válido mueve al destino y guarda', () => {
    const test = terminate()

    // terminate: from ['active', 'expiring'] → 'terminated'
    expect(test).toContain("ContractMother.reconstruct({ status: 'active' })")
    expect(test).toContain("expect(current.toPrimitives().status).toBe('terminated')")
    expect(test).toContain("repositoryMock.assertCalledTimes('save', 1)")
  })

  it('el estado ILEGAL sale de la máquina del modelo, no se inventa', () => {
    // status: ['active', 'expiring', 'expired', 'terminated']; terminate acepta active y expiring,
    // así que el primer estado que debe rechazar es 'expired'
    expect(terminate()).toContain("ContractMother.reconstruct({ status: 'expired' })")
    expect(terminate()).toMatch(/given an illegal source state[\s\S]{0,400}assertNotCalled\('save'\)/)

    // expire solo admite 'expiring', así que su ilegal es el primero de los otros: 'active'
    expect(read('backend-tests-application/expire-contract-usecase.test.ts')).toContain(
      "ContractMother.reconstruct({ status: 'active' })"
    )
  })

  it('un recurso sin máquina de estados no emite ningún test de transición', async () => {
    const other = createTreeWithEmptyWorkspace()
    await resourceGenerator(other, { name: 'project', directory: 'out' })

    const emitted = other
      .children('out/backend-tests-application')
      .filter(f => !/^(register|update|remove|get|search|export|aggregate)-/.test(f))

    expect(emitted).toEqual([])
  })
})
