import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { MongooseCustomerRepository } from '../../../src/contexts/sap-licensing/modules/customers/infrastructure/persistence/mongoose/mongoose-customer.repository'
import { CustomerWithIdSpecification } from '../../../src/contexts/sap-licensing/modules/customers/domain/specifications/customer-with-id.specification'
import { ConcurrencyConflictError } from '../../../src/contexts/shared/domain/errors'
import { CustomerId } from '../../../src/contexts/shared/domain/value-objects/customers/customer-id.vo'
import { SapId } from '../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/sap-id.vo'
import { TaxId } from '../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/tax-id.vo'
import { CustomerMother } from '../../modules/customers/domain/mothers/customer.mother'
import { CustomerBuilder } from '../../modules/customers/domain/mothers/customer.builder'

let repository: MongooseCustomerRepository

beforeAll(() => {
  repository = moduleFixture.get(MongooseCustomerRepository)
})

// Espejo del test de integración TypeORM: mismo puerto, mismas garantías. Corre contra un
// Mongo real (el del compose de test), no contra un doble.
describe('MongooseCustomerRepository (integration)', () => {
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

    it('dos saves sobre la misma versión leída: el primero gana, el segundo choca con 409 (spec 78)', async () => {
      const customer = CustomerMother.random()
      await repository.register(customer)

      const firstReader = await repository.get(customer.id)
      const secondReader = await repository.get(customer.id)

      await repository.save(firstReader!)
      await expect(repository.save(secondReader!)).rejects.toThrow(ConcurrencyConflictError)

      const persisted = await repository.get(customer.id)
      expect(persisted?.version).toBe(2)
    })

    it('keeps the embedded contacts inside the aggregate document', async () => {
      // la composición viaja EMBEBIDA: un solo documento, sin segunda colección
      const customer = CustomerMother.random()

      await repository.register(customer)
      const found = await repository.get(customer.id)

      expect(found?.contacts).toHaveLength(customer.contacts.length)
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

    it('exists / count reflect the persisted documents', async () => {
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

      // los meses vacíos los rellena el caso de uso: aquí solo vuelven los que tienen datos.
      // Un registro SIN fecha cae en el grupo '' (groupKeyOf(null)): también es contrato.
      for (const group of groups) {
        if (group.key !== '') expect(group.key).toMatch(/^\d{4}-\d{2}$/)
      }
    })
  })

  describe('unique opcional (partialFilterExpression)', () => {
    it('admite varios customer con taxId vacío sin que choque el índice único', async () => {
      // el índice de taxId es parcial: solo indexa los documentos que lo traen con valor,
      // así que los vacíos no compiten entre sí (equivalente al partial unique index de Postgres)
      const first = CustomerBuilder.aCustomer().withProps({ taxId: '' }).create()
      const second = CustomerBuilder.aCustomer().withProps({ taxId: '' }).create()

      await repository.register(first)
      await repository.register(second)

      expect((await repository.get(second.id))?.toPrimitives().taxId).toBe('')
    })

    it('sigue rechazando dos customer con el mismo taxId con valor', async () => {
      const value = CustomerMother.random().toPrimitives().taxId
      await repository.register(CustomerBuilder.aCustomer().withProps({ taxId: value }).create())

      await expect(
        repository.register(CustomerBuilder.aCustomer().withProps({ taxId: value }).create())
      ).rejects.toThrow(/already exists/i)
    })
  })

  describe('save', () => {
    it('replaces the whole document instead of inserting a second one', async () => {
      const customer = CustomerMother.random()
      await repository.register(customer)

      await repository.save(customer)

      expect(await repository.count(CustomerWithIdSpecification.withId(customer.id))).toBe(1)
    })
  })
})
