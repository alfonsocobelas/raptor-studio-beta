import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmParametroRepository } from '../../../src/contexts/aguas/modules/parametros/infrastructure/persistence/typeorm/typeorm-parametro.repository'
import { ParametroWithIdSpecification } from '../../../src/contexts/aguas/modules/parametros/domain/specifications/parametro-with-id.specification'
import { ParametroId } from '../../../src/contexts/shared/domain/value-objects/parametros/parametro-id.vo'
import { DeleteOperationId } from '../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { ParametroMother } from '../../modules/parametros/domain/mothers/parametro.mother'

let repository: TypeOrmParametroRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmParametroRepository)
})

describe('TypeOrmParametroRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new parametro and reads it back', async () => {
      const parametro = ParametroMother.random()

      await repository.register(parametro)
      const found = await repository.get(parametro.id)

      expect(found?.toPrimitives()).toEqual(parametro.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(ParametroId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the parametro selected by criteria', async () => {
      const parametro = ParametroMother.random()
      await repository.register(parametro)

      const results = await repository.matching(ParametroWithIdSpecification.withId(parametro.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(parametro.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const parametro = ParametroMother.random()
      await repository.register(parametro)

      const spec = ParametroWithIdSpecification.withId(parametro.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = ParametroWithIdSpecification.withId(ParametroId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted parametro', async () => {
      const parametro = ParametroMother.random()
      await repository.register(parametro)

      await repository.remove(parametro.id, DeleteOperationId.random())

      expect(await repository.get(parametro.id)).toBeNull()
    })
  })

  describe('trash', () => {
    it('a removed parametro leaves matching and shows up in matchingDeleted', async () => {
      const parametro = ParametroMother.random()
      await repository.register(parametro)
      await repository.remove(parametro.id, DeleteOperationId.random())

      const spec = ParametroWithIdSpecification.withId(parametro.id)
      expect(await repository.matching(spec)).toHaveLength(0)

      const deleted = await repository.matchingDeleted(spec)
      expect(deleted).toHaveLength(1)
      expect(deleted[0].toPrimitives()).toEqual(parametro.toPrimitives())
      expect(await repository.countDeleted(spec)).toBe(1)
    })

    it('restore brings it back; a live or unknown id restores nothing', async () => {
      const parametro = ParametroMother.random()
      await repository.register(parametro)
      await repository.remove(parametro.id, DeleteOperationId.random())

      expect(await repository.restore(parametro.id)).toBe(true)
      expect(await repository.get(parametro.id)).not.toBeNull()

      // ya está vivo: restaurarlo otra vez no encuentra nada borrado
      expect(await repository.restore(parametro.id)).toBe(false)
      expect(await repository.restore(ParametroId.create(uuidv7()))).toBe(false)
    })
  })
})
