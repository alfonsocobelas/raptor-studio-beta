import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmVehicleRepository } from '../../../src/contexts/dealership/modules/vehicles/infrastructure/persistence/typeorm/typeorm-vehicle.repository'
import { VehicleWithIdSpecification } from '../../../src/contexts/dealership/modules/vehicles/domain/specifications/vehicle-with-id.specification'
import { VehicleId } from '../../../src/contexts/shared/domain/value-objects/vehicles/vehicle-id.vo'
import { Vin } from '../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vin.vo'
import { Plate } from '../../../src/contexts/dealership/modules/vehicles/domain/value-objects/plate.vo'
import { VehicleMother } from '../../modules/vehicles/domain/mothers/vehicle.mother'

let repository: TypeOrmVehicleRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmVehicleRepository)
})

describe('TypeOrmVehicleRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new vehicle and reads it back', async () => {
      const vehicle = VehicleMother.random()

      await repository.register(vehicle)
      const found = await repository.get(vehicle.id)

      expect(found?.toPrimitives()).toEqual(vehicle.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(VehicleId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('findByVin', () => {
    it('finds a persisted vehicle by its vin', async () => {
      const vehicle = VehicleMother.random()
      await repository.register(vehicle)

      const found = await repository.findByVin(Vin.create(vehicle.toPrimitives().vin))

      expect(found?.toPrimitives()).toEqual(vehicle.toPrimitives())
    })

    it('returns null when no vehicle has that vin', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = VehicleMother.random()

      const found = await repository.findByVin(Vin.create(unregistered.toPrimitives().vin))

      expect(found).toBeNull()
    })
  })

  describe('findByPlate', () => {
    it('finds a persisted vehicle by its plate', async () => {
      const vehicle = VehicleMother.random()
      await repository.register(vehicle)

      const found = await repository.findByPlate(Plate.create(vehicle.toPrimitives().plate))

      expect(found?.toPrimitives()).toEqual(vehicle.toPrimitives())
    })

    it('returns null when no vehicle has that plate', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = VehicleMother.random()

      const found = await repository.findByPlate(Plate.create(unregistered.toPrimitives().plate))

      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the vehicle selected by criteria', async () => {
      const vehicle = VehicleMother.random()
      await repository.register(vehicle)

      const results = await repository.matching(VehicleWithIdSpecification.withId(vehicle.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(vehicle.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const vehicle = VehicleMother.random()
      await repository.register(vehicle)

      const spec = VehicleWithIdSpecification.withId(vehicle.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = VehicleWithIdSpecification.withId(VehicleId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted vehicle', async () => {
      const vehicle = VehicleMother.random()
      await repository.register(vehicle)

      await repository.remove(vehicle.id)

      expect(await repository.get(vehicle.id)).toBeNull()
    })
  })
})
