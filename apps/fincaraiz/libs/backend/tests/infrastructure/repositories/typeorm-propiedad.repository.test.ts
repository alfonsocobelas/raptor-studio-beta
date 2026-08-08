import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmPropiedadRepository } from '../../../src/contexts/fincaraiz/modules/propiedades/infrastructure/persistence/typeorm/typeorm-propiedad.repository'
import { PropiedadWithIdSpecification } from '../../../src/contexts/fincaraiz/modules/propiedades/domain/specifications/propiedad-with-id.specification'
import { PropiedadId } from '../../../src/contexts/shared/domain/value-objects/propiedades/propiedad-id.vo'
import { PropiedadMother } from '../../modules/propiedades/domain/mothers/propiedad.mother'

let repository: TypeOrmPropiedadRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmPropiedadRepository)
})

describe('TypeOrmPropiedadRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new propiedad and reads it back', async () => {
      const propiedad = PropiedadMother.random()

      await repository.register(propiedad)
      const found = await repository.get(propiedad.id)

      expect(found?.toPrimitives()).toEqual(propiedad.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(PropiedadId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the propiedad selected by criteria', async () => {
      const propiedad = PropiedadMother.random()
      await repository.register(propiedad)

      const results = await repository.matching(PropiedadWithIdSpecification.withId(propiedad.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(propiedad.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const propiedad = PropiedadMother.random()
      await repository.register(propiedad)

      const spec = PropiedadWithIdSpecification.withId(propiedad.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = PropiedadWithIdSpecification.withId(PropiedadId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted propiedad', async () => {
      const propiedad = PropiedadMother.random()
      await repository.register(propiedad)

      await repository.remove(propiedad.id)

      expect(await repository.get(propiedad.id)).toBeNull()
    })
  })
})
