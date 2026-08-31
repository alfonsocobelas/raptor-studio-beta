import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { resourceGenerator } from './resource'

/**
 * Spec 80: la otra familia de casos de uso que no nació del CRUD. La hija de composición se
 * añadía, editaba y borraba sin un solo test emitido, y el use case decide dos cosas que
 * conviene fijar: que un padre inexistente no guarda nada, y que la colección del padre queda
 * como debe tras la operación.
 */
describe('el test emitido de la composición', () => {
  let tree: Tree
  const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''
  const at = (op: string): string => read(`backend-tests-application/${op}-contact-usecase.test.ts`)

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await resourceGenerator(tree, { name: 'customer', directory: 'out' })
  })

  it('emite un test por operación de la hija', () => {
    expect(at('add')).toContain("describe('AddContactUseCase'")
    expect(at('update')).toContain("describe('UpdateContactUseCase'")
    expect(at('remove')).toContain("describe('RemoveContactUseCase'")
  })

  it('el padre inexistente no guarda nada, en las tres', () => {
    for (const op of ['add', 'update', 'remove']) {
      expect(at(op)).toContain('repositoryMock.givenNotFound()')
      expect(at(op)).toMatch(/rejects\.toThrow\(EntityNotFoundError\)/)
      expect(at(op)).toContain("repositoryMock.assertNotCalled('save')")
    }
  })

  it('la transacción se ejecuta de verdad en el doble: si no, el test pasaría en falso', () => {
    // el use case envuelve todo en txManager.runInTransaction, así que un doble que no invoque
    // la función haría pasar los tests sin ejecutar una línea del cuerpo
    expect(at('add')).toContain('runInTransaction: jest.fn(<T>(work: () => Promise<T>) => work())')
  })

  it('el alta mete la hija en la colección del padre y guarda una vez', () => {
    const test = at('add')

    expect(test).toContain('expect(parent.contacts).toHaveLength(1)')
    expect(test).toContain("repositoryMock.assertCalledTimes('save', 1)")
  })

  it('el hijo de muestra respeta los VOs: los opcionales van vacíos, no con literales inválidos', () => {
    const test = at('add')

    expect(test).toContain('id: uuidv7()')
    expect(test).toMatch(/name: '[^']+'/) // required: necesita valor de verdad
    // Los VOs con FORMATO revientan con un literal genérico: ContactEmail valida email y el
    // Phone compartido solo admite dígitos y símbolos, así que 'Email 1' y 'Phone 1' no
    // pasarían. El propio caso de uso emitido ya declara cuál es el valor de un opcional
    // ausente (`input.contact.email ?? ''`), y el test usa el mismo.
    expect(test).toContain("email: ''")
    expect(test).toContain("phone: ''")
    expect(test).not.toContain("'Email 1'")
    expect(test).not.toContain("'Phone 1'")
  })

  it('la baja deja la colección vacía y guarda una vez', () => {
    const test = at('remove')

    expect(test).toContain('expect(parent.contacts).toHaveLength(0)')
    expect(test).toContain("repositoryMock.assertCalledTimes('save', 1)")
  })

  it('un recurso sin composición no emite ningún test de hija', async () => {
    const other = createTreeWithEmptyWorkspace()
    await resourceGenerator(other, { name: 'contract', directory: 'out' })

    const emitted = other.children('out/backend-tests-application').filter(f => f.includes('-contact-'))

    expect(emitted).toEqual([])
  })
})
