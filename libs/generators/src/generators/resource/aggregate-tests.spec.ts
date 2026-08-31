import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 80: el agregado es el único sitio donde vive el invariante, y no tenía test emitido.
 * Dos afirmaciones que valen para cualquier modelo: que los primitivos redondean sin perder
 * campos (el mapeo es lo que más se rompe al añadir un campo) y que cada verbo de la máquina
 * mueve al destino y rechaza desde donde no debe.
 */
describe('el test emitido del agregado', () => {
  let tree: Tree
  const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''
  const aggregate = (): string => read('backend-tests-domain/contract.aggregate.test.ts')

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'contract', directory: 'out' })
  })

  it('emite el test del agregado', () => {
    expect(aggregate()).toContain("describe('Contract'")
  })

  it('fija el redondeo de primitivos: lo que entra por fromPrimitives sale por toPrimitives', () => {
    const test = aggregate()

    expect(test).toContain('const primitives = ContractMother.primitives()')
    expect(test).toContain('expect(Contract.fromPrimitives(primitives).toPrimitives()).toEqual(primitives)')
  })

  it('la mother se importa desde su carpeta hermana, con la profundidad de domain/', () => {
    const test = aggregate()

    expect(test).toContain("from './mothers/contract.mother'")
    expect(test).toContain("from '../../../../src/contexts/sap-licensing/modules/contracts/domain/contract'")
  })

  it('cada verbo de la máquina mueve al estado destino', () => {
    const test = aggregate()

    expect(test).toMatch(/terminate\(\)[\s\S]{0,200}toBe\('terminated'\)/)
    expect(test).toMatch(/expire\(\)[\s\S]{0,200}toBe\('expired'\)/)
  })

  it('cada verbo rechaza desde el estado que la máquina no admite', () => {
    const test = aggregate()

    // terminate acepta active|expiring → debe rechazar expired; expire solo expiring → active
    expect(test).toMatch(/status: 'expired'[\s\S]{0,200}toThrow\(\)/)
    expect(test).toMatch(/status: 'active'[\s\S]{0,200}toThrow\(\)/)
  })

  it('un recurso sin máquina emite el redondeo pero ninguna sección de transiciones', async () => {
    const other = createTreeWithEmptyWorkspace()
    await resourceGenerator(other, { name: 'project', directory: 'out' })
    const test = other.read('out/backend-tests-domain/project.aggregate.test.ts', 'utf-8') ?? ''

    expect(test).toContain('toEqual(primitives)')
    expect(test).not.toContain('describe(\'transitions')
  })
})
