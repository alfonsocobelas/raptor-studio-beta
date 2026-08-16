import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmMuestraRepository } from '../../../src/contexts/aguas/modules/muestras/infrastructure/persistence/typeorm/typeorm-muestra.repository'
import { MuestraWithIdSpecification } from '../../../src/contexts/aguas/modules/muestras/domain/specifications/muestra-with-id.specification'
import { MuestraId } from '../../../src/contexts/shared/domain/value-objects/muestras/muestra-id.vo'
import { DeleteOperationId } from '../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { MuestraMother } from '../../modules/muestras/domain/mothers/muestra.mother'

let repository: TypeOrmMuestraRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmMuestraRepository)
})

describe('TypeOrmMuestraRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new muestra and reads it back', async () => {
      const muestra = MuestraMother.random()

      await repository.register(muestra)
      const found = await repository.get(muestra.id)

      expect(found?.toPrimitives()).toEqual(muestra.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(MuestraId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the muestra selected by criteria', async () => {
      const muestra = MuestraMother.random()
      await repository.register(muestra)

      const results = await repository.matching(MuestraWithIdSpecification.withId(muestra.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(muestra.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const muestra = MuestraMother.random()
      await repository.register(muestra)

      const spec = MuestraWithIdSpecification.withId(muestra.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = MuestraWithIdSpecification.withId(MuestraId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted muestra', async () => {
      const muestra = MuestraMother.random()
      await repository.register(muestra)

      await repository.remove(muestra.id, DeleteOperationId.random())

      expect(await repository.get(muestra.id)).toBeNull()
    })
  })

  describe('trash', () => {
    it('a removed muestra leaves matching and shows up in matchingDeleted', async () => {
      const muestra = MuestraMother.random()
      await repository.register(muestra)
      await repository.remove(muestra.id, DeleteOperationId.random())

      const spec = MuestraWithIdSpecification.withId(muestra.id)
      expect(await repository.matching(spec)).toHaveLength(0)

      const deleted = await repository.matchingDeleted(spec)
      expect(deleted).toHaveLength(1)
      expect(deleted[0].toPrimitives()).toEqual(muestra.toPrimitives())
      expect(await repository.countDeleted(spec)).toBe(1)
    })

    it('restore brings it back; a live or unknown id restores nothing', async () => {
      const muestra = MuestraMother.random()
      await repository.register(muestra)
      await repository.remove(muestra.id, DeleteOperationId.random())

      expect(await repository.restore(muestra.id)).toBe(true)
      expect(await repository.get(muestra.id)).not.toBeNull()

      // ya está vivo: restaurarlo otra vez no encuentra nada borrado
      expect(await repository.restore(muestra.id)).toBe(false)
      expect(await repository.restore(MuestraId.create(uuidv7()))).toBe(false)
    })
  })
})
