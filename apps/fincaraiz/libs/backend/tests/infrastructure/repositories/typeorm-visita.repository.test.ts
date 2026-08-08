import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmVisitaRepository } from '../../../src/contexts/fincaraiz/modules/visitas/infrastructure/persistence/typeorm/typeorm-visita.repository'
import { VisitaWithIdSpecification } from '../../../src/contexts/fincaraiz/modules/visitas/domain/specifications/visita-with-id.specification'
import { VisitaId } from '../../../src/contexts/shared/domain/value-objects/visitas/visita-id.vo'
import { VisitaMother } from '../../modules/visitas/domain/mothers/visita.mother'

let repository: TypeOrmVisitaRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmVisitaRepository)
})

describe('TypeOrmVisitaRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new visita and reads it back', async () => {
      const visita = VisitaMother.random()

      await repository.register(visita)
      const found = await repository.get(visita.id)

      expect(found?.toPrimitives()).toEqual(visita.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(VisitaId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the visita selected by criteria', async () => {
      const visita = VisitaMother.random()
      await repository.register(visita)

      const results = await repository.matching(VisitaWithIdSpecification.withId(visita.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(visita.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const visita = VisitaMother.random()
      await repository.register(visita)

      const spec = VisitaWithIdSpecification.withId(visita.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = VisitaWithIdSpecification.withId(VisitaId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted visita', async () => {
      const visita = VisitaMother.random()
      await repository.register(visita)

      await repository.remove(visita.id)

      expect(await repository.get(visita.id)).toBeNull()
    })
  })
})
