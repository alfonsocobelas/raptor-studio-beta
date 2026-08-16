import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmPuntoRepository } from '../../../src/contexts/aguas/modules/puntos/infrastructure/persistence/typeorm/typeorm-punto.repository'
import { PuntoWithIdSpecification } from '../../../src/contexts/aguas/modules/puntos/domain/specifications/punto-with-id.specification'
import { PuntoId } from '../../../src/contexts/shared/domain/value-objects/puntos/punto-id.vo'
import { DeleteOperationId } from '../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { PuntoMother } from '../../modules/puntos/domain/mothers/punto.mother'

let repository: TypeOrmPuntoRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmPuntoRepository)
})

describe('TypeOrmPuntoRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new punto and reads it back', async () => {
      const punto = PuntoMother.random()

      await repository.register(punto)
      const found = await repository.get(punto.id)

      expect(found?.toPrimitives()).toEqual(punto.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(PuntoId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the punto selected by criteria', async () => {
      const punto = PuntoMother.random()
      await repository.register(punto)

      const results = await repository.matching(PuntoWithIdSpecification.withId(punto.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(punto.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const punto = PuntoMother.random()
      await repository.register(punto)

      const spec = PuntoWithIdSpecification.withId(punto.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = PuntoWithIdSpecification.withId(PuntoId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted punto', async () => {
      const punto = PuntoMother.random()
      await repository.register(punto)

      await repository.remove(punto.id, DeleteOperationId.random())

      expect(await repository.get(punto.id)).toBeNull()
    })
  })

  describe('trash', () => {
    it('a removed punto leaves matching and shows up in matchingDeleted', async () => {
      const punto = PuntoMother.random()
      await repository.register(punto)
      await repository.remove(punto.id, DeleteOperationId.random())

      const spec = PuntoWithIdSpecification.withId(punto.id)
      expect(await repository.matching(spec)).toHaveLength(0)

      const deleted = await repository.matchingDeleted(spec)
      expect(deleted).toHaveLength(1)
      expect(deleted[0].toPrimitives()).toEqual(punto.toPrimitives())
      expect(await repository.countDeleted(spec)).toBe(1)
    })

    it('restore brings it back; a live or unknown id restores nothing', async () => {
      const punto = PuntoMother.random()
      await repository.register(punto)
      await repository.remove(punto.id, DeleteOperationId.random())

      expect(await repository.restore(punto.id)).toBe(true)
      expect(await repository.get(punto.id)).not.toBeNull()

      // ya está vivo: restaurarlo otra vez no encuentra nada borrado
      expect(await repository.restore(punto.id)).toBe(false)
      expect(await repository.restore(PuntoId.create(uuidv7()))).toBe(false)
    })
  })
})
