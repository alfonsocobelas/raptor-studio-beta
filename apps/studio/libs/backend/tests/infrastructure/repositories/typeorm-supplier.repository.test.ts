import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmSupplierRepository } from '../../../src/contexts/warehouse/modules/suppliers/infrastructure/persistence/typeorm/typeorm-supplier.repository'
import { SupplierWithIdSpecification } from '../../../src/contexts/warehouse/modules/suppliers/domain/specifications/supplier-with-id.specification'
import { SupplierId } from '../../../src/contexts/shared/domain/value-objects/suppliers/supplier-id.vo'
import { SupplierTaxId } from '../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-tax-id.vo'
import { SupplierMother } from '../../modules/suppliers/domain/mothers/supplier.mother'

let repository: TypeOrmSupplierRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmSupplierRepository)
})

describe('TypeOrmSupplierRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new supplier and reads it back', async () => {
      const supplier = SupplierMother.random()

      await repository.register(supplier)
      const found = await repository.get(supplier.id)

      expect(found?.toPrimitives()).toEqual(supplier.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(SupplierId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('findByTaxId', () => {
    it('finds a persisted supplier by its taxId', async () => {
      const supplier = SupplierMother.random()
      await repository.register(supplier)

      const found = await repository.findByTaxId(SupplierTaxId.create(supplier.toPrimitives().taxId))

      expect(found?.toPrimitives()).toEqual(supplier.toPrimitives())
    })

    it('returns null when no supplier has that taxId', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = SupplierMother.random()

      const found = await repository.findByTaxId(SupplierTaxId.create(unregistered.toPrimitives().taxId))

      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the supplier selected by criteria', async () => {
      const supplier = SupplierMother.random()
      await repository.register(supplier)

      const results = await repository.matching(SupplierWithIdSpecification.withId(supplier.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(supplier.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const supplier = SupplierMother.random()
      await repository.register(supplier)

      const spec = SupplierWithIdSpecification.withId(supplier.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = SupplierWithIdSpecification.withId(SupplierId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted supplier', async () => {
      const supplier = SupplierMother.random()
      await repository.register(supplier)

      await repository.remove(supplier.id)

      expect(await repository.get(supplier.id)).toBeNull()
    })
  })
})
