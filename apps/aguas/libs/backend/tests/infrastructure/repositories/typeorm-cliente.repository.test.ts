import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmClienteRepository } from '../../../src/contexts/aguas/modules/clientes/infrastructure/persistence/typeorm/typeorm-cliente.repository'
import { ClienteWithIdSpecification } from '../../../src/contexts/aguas/modules/clientes/domain/specifications/cliente-with-id.specification'
import { ClienteId } from '../../../src/contexts/shared/domain/value-objects/clientes/cliente-id.vo'
import { DeleteOperationId } from '../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { ClienteMother } from '../../modules/clientes/domain/mothers/cliente.mother'

let repository: TypeOrmClienteRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmClienteRepository)
})

describe('TypeOrmClienteRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new cliente and reads it back', async () => {
      const cliente = ClienteMother.random()

      await repository.register(cliente)
      const found = await repository.get(cliente.id)

      expect(found?.toPrimitives()).toEqual(cliente.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(ClienteId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the cliente selected by criteria', async () => {
      const cliente = ClienteMother.random()
      await repository.register(cliente)

      const results = await repository.matching(ClienteWithIdSpecification.withId(cliente.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(cliente.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const cliente = ClienteMother.random()
      await repository.register(cliente)

      const spec = ClienteWithIdSpecification.withId(cliente.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = ClienteWithIdSpecification.withId(ClienteId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted cliente', async () => {
      const cliente = ClienteMother.random()
      await repository.register(cliente)

      await repository.remove(cliente.id, DeleteOperationId.random())

      expect(await repository.get(cliente.id)).toBeNull()
    })
  })

  describe('trash', () => {
    it('a removed cliente leaves matching and shows up in matchingDeleted', async () => {
      const cliente = ClienteMother.random()
      await repository.register(cliente)
      await repository.remove(cliente.id, DeleteOperationId.random())

      const spec = ClienteWithIdSpecification.withId(cliente.id)
      expect(await repository.matching(spec)).toHaveLength(0)

      const deleted = await repository.matchingDeleted(spec)
      expect(deleted).toHaveLength(1)
      expect(deleted[0].toPrimitives()).toEqual(cliente.toPrimitives())
      expect(await repository.countDeleted(spec)).toBe(1)
    })

    it('restore brings it back; a live or unknown id restores nothing', async () => {
      const cliente = ClienteMother.random()
      await repository.register(cliente)
      await repository.remove(cliente.id, DeleteOperationId.random())

      expect(await repository.restore(cliente.id)).toBe(true)
      expect(await repository.get(cliente.id)).not.toBeNull()

      // ya está vivo: restaurarlo otra vez no encuentra nada borrado
      expect(await repository.restore(cliente.id)).toBe(false)
      expect(await repository.restore(ClienteId.create(uuidv7()))).toBe(false)
    })
  })
})
