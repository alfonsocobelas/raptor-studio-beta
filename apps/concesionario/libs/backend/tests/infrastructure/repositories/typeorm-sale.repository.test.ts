import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmSaleRepository } from '../../../src/contexts/dealership/modules/sales/infrastructure/persistence/typeorm/typeorm-sale.repository'
import { SaleWithIdSpecification } from '../../../src/contexts/dealership/modules/sales/domain/specifications/sale-with-id.specification'
import { SaleId } from '../../../src/contexts/shared/domain/value-objects/sales/sale-id.vo'
import { SaleReference } from '../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-reference.vo'
import { SaleMother } from '../../modules/sales/domain/mothers/sale.mother'

let repository: TypeOrmSaleRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmSaleRepository)
})

describe('TypeOrmSaleRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new sale and reads it back', async () => {
      const sale = SaleMother.random()

      await repository.register(sale)
      const found = await repository.get(sale.id)

      expect(found?.toPrimitives()).toEqual(sale.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(SaleId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('findByReference', () => {
    it('finds a persisted sale by its reference', async () => {
      const sale = SaleMother.random()
      await repository.register(sale)

      const found = await repository.findByReference(SaleReference.create(sale.toPrimitives().reference))

      expect(found?.toPrimitives()).toEqual(sale.toPrimitives())
    })

    it('returns null when no sale has that reference', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = SaleMother.random()

      const found = await repository.findByReference(SaleReference.create(unregistered.toPrimitives().reference))

      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the sale selected by criteria', async () => {
      const sale = SaleMother.random()
      await repository.register(sale)

      const results = await repository.matching(SaleWithIdSpecification.withId(sale.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(sale.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const sale = SaleMother.random()
      await repository.register(sale)

      const spec = SaleWithIdSpecification.withId(sale.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = SaleWithIdSpecification.withId(SaleId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted sale', async () => {
      const sale = SaleMother.random()
      await repository.register(sale)

      await repository.remove(sale.id)

      expect(await repository.get(sale.id)).toBeNull()
    })
  })
})
