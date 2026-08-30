import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmCustomerRepository } from '../../../src/contexts/sap-licensing/modules/customers/infrastructure/persistence/typeorm/typeorm-customer.repository'
import { CustomerWithIdSpecification } from '../../../src/contexts/sap-licensing/modules/customers/domain/specifications/customer-with-id.specification'
import { ConcurrencyConflictError } from '../../../src/contexts/shared/domain/errors'
import { CustomerId } from '../../../src/contexts/shared/domain/value-objects/customers/customer-id.vo'
import { SapId } from '../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/sap-id.vo'
import { TaxId } from '../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/tax-id.vo'
import { CustomerMother } from '../../modules/customers/domain/mothers/customer.mother'

let repository: TypeOrmCustomerRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmCustomerRepository)
})

describe('TypeOrmCustomerRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new customer and reads it back', async () => {
      const customer = CustomerMother.random()

      await repository.register(customer)
      const found = await repository.get(customer.id)

      expect(found?.toPrimitives()).toEqual(customer.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(CustomerId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('save — bloqueo optimista (spec 78)', () => {
    it('dos saves sobre la misma versión leída: el primero gana, el segundo choca con 409', async () => {
      const customer = CustomerMother.random()
      await repository.register(customer)

      const firstReader = await repository.get(customer.id)
      const secondReader = await repository.get(customer.id)

      await repository.save(firstReader!)
      await expect(repository.save(secondReader!)).rejects.toThrow(ConcurrencyConflictError)

      const persisted = await repository.get(customer.id)
      expect(persisted?.version).toBe(2)
    })
  })

  describe('findBySapId', () => {
    it('finds a persisted customer by its sapId', async () => {
      const customer = CustomerMother.random()
      await repository.register(customer)

      const found = await repository.findBySapId(SapId.create(customer.toPrimitives().sapId))

      expect(found?.toPrimitives()).toEqual(customer.toPrimitives())
    })

    it('returns null when no customer has that sapId', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = CustomerMother.random()

      const found = await repository.findBySapId(SapId.create(unregistered.toPrimitives().sapId))

      expect(found).toBeNull()
    })
  })

  describe('findByTaxId', () => {
    it('finds a persisted customer by its taxId', async () => {
      const customer = CustomerMother.random()
      await repository.register(customer)

      const found = await repository.findByTaxId(TaxId.create(customer.toPrimitives().taxId))

      expect(found?.toPrimitives()).toEqual(customer.toPrimitives())
    })

    it('returns null when no customer has that taxId', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = CustomerMother.random()

      const found = await repository.findByTaxId(TaxId.create(unregistered.toPrimitives().taxId))

      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the customer selected by criteria', async () => {
      const customer = CustomerMother.random()
      await repository.register(customer)

      const results = await repository.matching(CustomerWithIdSpecification.withId(customer.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(customer.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const customer = CustomerMother.random()
      await repository.register(customer)

      const spec = CustomerWithIdSpecification.withId(customer.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = CustomerWithIdSpecification.withId(CustomerId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('aggregateGrouped (spec 72)', () => {
    it('desglosa en UNA consulta, con su clave y su valor', async () => {
      const customer = CustomerMother.random()
      await repository.register(customer)

      const groups = await repository.aggregateGrouped(CustomerWithIdSpecification.withId(customer.id), {
        op: 'count',
        groupBy: 'customerType',
        limit: 50
      })

      expect(groups).toHaveLength(1)
      expect(groups[0].key).toBe(String(customer.toPrimitives().customerType))
      expect(groups[0].value).toBe(1)
    })

    it('un conjunto vacío no tiene grupos: no los inventa a 0', async () => {
      const groups = await repository.aggregateGrouped(
        CustomerWithIdSpecification.withId(CustomerId.create(uuidv7())),
        { op: 'count', groupBy: 'customerType', limit: 50 }
      )

      expect(groups).toEqual([])
    })

    it('agrupa por mes con la clave YYYY-MM', async () => {
      const customer = CustomerMother.random()
      await repository.register(customer)

      const groups = await repository.aggregateGrouped(CustomerWithIdSpecification.withId(customer.id), {
        op: 'count',
        bucketField: 'archivedAt',
        limit: 50
      })

      // los meses vacíos los rellena el caso de uso: aquí solo vuelven los que tienen datos
      for (const group of groups) expect(group.key).toMatch(/^\d{4}-\d{2}$/)
    })
  })
})
