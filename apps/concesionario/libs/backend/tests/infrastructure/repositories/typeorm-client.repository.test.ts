import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmClientRepository } from '../../../src/contexts/dealership/modules/clients/infrastructure/persistence/typeorm/typeorm-client.repository'
import { ClientWithIdSpecification } from '../../../src/contexts/dealership/modules/clients/domain/specifications/client-with-id.specification'
import { ClientId } from '../../../src/contexts/shared/domain/value-objects/clients/client-id.vo'
import { ClientTaxId } from '../../../src/contexts/dealership/modules/clients/domain/value-objects/client-tax-id.vo'
import { ClientMother } from '../../modules/clients/domain/mothers/client.mother'

let repository: TypeOrmClientRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmClientRepository)
})

describe('TypeOrmClientRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new client and reads it back', async () => {
      const client = ClientMother.random()

      await repository.register(client)
      const found = await repository.get(client.id)

      expect(found?.toPrimitives()).toEqual(client.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(ClientId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('findByTaxId', () => {
    it('finds a persisted client by its taxId', async () => {
      const client = ClientMother.random()
      await repository.register(client)

      const found = await repository.findByTaxId(ClientTaxId.create(client.toPrimitives().taxId))

      expect(found?.toPrimitives()).toEqual(client.toPrimitives())
    })

    it('returns null when no client has that taxId', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = ClientMother.random()

      const found = await repository.findByTaxId(ClientTaxId.create(unregistered.toPrimitives().taxId))

      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the client selected by criteria', async () => {
      const client = ClientMother.random()
      await repository.register(client)

      const results = await repository.matching(ClientWithIdSpecification.withId(client.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(client.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const client = ClientMother.random()
      await repository.register(client)

      const spec = ClientWithIdSpecification.withId(client.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = ClientWithIdSpecification.withId(ClientId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted client', async () => {
      const client = ClientMother.random()
      await repository.register(client)

      await repository.remove(client.id)

      expect(await repository.get(client.id)).toBeNull()
    })
  })
})
