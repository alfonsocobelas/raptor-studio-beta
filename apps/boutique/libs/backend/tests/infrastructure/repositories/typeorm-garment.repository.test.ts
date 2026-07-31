import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmGarmentRepository } from '../../../src/contexts/warehouse/modules/garments/infrastructure/persistence/typeorm/typeorm-garment.repository'
import { GarmentWithIdSpecification } from '../../../src/contexts/warehouse/modules/garments/domain/specifications/garment-with-id.specification'
import { GarmentId } from '../../../src/contexts/shared/domain/value-objects/garments/garment-id.vo'
import { Sku } from '../../../src/contexts/warehouse/modules/garments/domain/value-objects/sku.vo'
import { GarmentMother } from '../../modules/garments/domain/mothers/garment.mother'

let repository: TypeOrmGarmentRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmGarmentRepository)
})

describe('TypeOrmGarmentRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new garment and reads it back', async () => {
      const garment = GarmentMother.random()

      await repository.register(garment)
      const found = await repository.get(garment.id)

      expect(found?.toPrimitives()).toEqual(garment.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(GarmentId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('findBySku', () => {
    it('finds a persisted garment by its sku', async () => {
      const garment = GarmentMother.random()
      await repository.register(garment)

      const found = await repository.findBySku(Sku.create(garment.toPrimitives().sku))

      expect(found?.toPrimitives()).toEqual(garment.toPrimitives())
    })

    it('returns null when no garment has that sku', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = GarmentMother.random()

      const found = await repository.findBySku(Sku.create(unregistered.toPrimitives().sku))

      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the garment selected by criteria', async () => {
      const garment = GarmentMother.random()
      await repository.register(garment)

      const results = await repository.matching(GarmentWithIdSpecification.withId(garment.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(garment.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const garment = GarmentMother.random()
      await repository.register(garment)

      const spec = GarmentWithIdSpecification.withId(garment.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = GarmentWithIdSpecification.withId(GarmentId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted garment', async () => {
      const garment = GarmentMother.random()
      await repository.register(garment)

      await repository.remove(garment.id)

      expect(await repository.get(garment.id)).toBeNull()
    })
  })
})
