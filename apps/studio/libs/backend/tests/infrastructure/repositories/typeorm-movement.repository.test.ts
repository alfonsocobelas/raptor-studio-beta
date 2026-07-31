import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmMovementRepository } from '../../../src/contexts/warehouse/modules/movements/infrastructure/persistence/typeorm/typeorm-movement.repository'
import { MovementWithIdSpecification } from '../../../src/contexts/warehouse/modules/movements/domain/specifications/movement-with-id.specification'
import { MovementId } from '../../../src/contexts/shared/domain/value-objects/movements/movement-id.vo'
import { MovementReference } from '../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-reference.vo'
import { MovementMother } from '../../modules/movements/domain/mothers/movement.mother'

let repository: TypeOrmMovementRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmMovementRepository)
})

describe('TypeOrmMovementRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new movement and reads it back', async () => {
      const movement = MovementMother.random()

      await repository.register(movement)
      const found = await repository.get(movement.id)

      expect(found?.toPrimitives()).toEqual(movement.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(MovementId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('findByReference', () => {
    it('finds a persisted movement by its reference', async () => {
      const movement = MovementMother.random()
      await repository.register(movement)

      const found = await repository.findByReference(MovementReference.create(movement.toPrimitives().reference))

      expect(found?.toPrimitives()).toEqual(movement.toPrimitives())
    })

    it('returns null when no movement has that reference', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = MovementMother.random()

      const found = await repository.findByReference(MovementReference.create(unregistered.toPrimitives().reference))

      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the movement selected by criteria', async () => {
      const movement = MovementMother.random()
      await repository.register(movement)

      const results = await repository.matching(MovementWithIdSpecification.withId(movement.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(movement.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const movement = MovementMother.random()
      await repository.register(movement)

      const spec = MovementWithIdSpecification.withId(movement.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = MovementWithIdSpecification.withId(MovementId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted movement', async () => {
      const movement = MovementMother.random()
      await repository.register(movement)

      await repository.remove(movement.id)

      expect(await repository.get(movement.id)).toBeNull()
    })
  })
})
