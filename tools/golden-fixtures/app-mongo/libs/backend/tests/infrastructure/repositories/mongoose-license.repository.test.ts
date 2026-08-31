import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { MongooseLicenseRepository } from '../../../src/contexts/sap-licensing/modules/licenses/infrastructure/persistence/mongoose/mongoose-license.repository'
import { LicenseWithIdSpecification } from '../../../src/contexts/sap-licensing/modules/licenses/domain/specifications/license-with-id.specification'
import { ConcurrencyConflictError } from '../../../src/contexts/shared/domain/errors'
import { LicenseId } from '../../../src/contexts/shared/domain/value-objects/licenses/license-id.vo'
import { DeleteOperationId } from '../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { LicenseMother } from '../../modules/licenses/domain/mothers/license.mother'

let repository: MongooseLicenseRepository

beforeAll(() => {
  repository = moduleFixture.get(MongooseLicenseRepository)
})

// Espejo del test de integración TypeORM: mismo puerto, mismas garantías. Corre contra un
// Mongo real (el del compose de test), no contra un doble.
describe('MongooseLicenseRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new license and reads it back', async () => {
      const license = LicenseMother.random()

      await repository.register(license)
      const found = await repository.get(license.id)

      expect(found?.toPrimitives()).toEqual(license.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(LicenseId.create(uuidv7()))
      expect(found).toBeNull()
    })

    it('dos saves sobre la misma versión leída: el primero gana, el segundo choca con 409 (spec 78)', async () => {
      const license = LicenseMother.random()
      await repository.register(license)

      const firstReader = await repository.get(license.id)
      const secondReader = await repository.get(license.id)

      await repository.save(firstReader!)
      await expect(repository.save(secondReader!)).rejects.toThrow(ConcurrencyConflictError)

      const persisted = await repository.get(license.id)
      expect(persisted?.version).toBe(2)
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the license selected by criteria', async () => {
      const license = LicenseMother.random()
      await repository.register(license)

      const results = await repository.matching(LicenseWithIdSpecification.withId(license.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(license.toPrimitives())
    })

    it('exists / count reflect the persisted documents', async () => {
      const license = LicenseMother.random()
      await repository.register(license)

      const spec = LicenseWithIdSpecification.withId(license.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = LicenseWithIdSpecification.withId(LicenseId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('aggregate (spec 71)', () => {
    it('agrega el conjunto filtrado, y el vacío no responde lo mismo en todas las operaciones', async () => {
      const license = LicenseMother.random()
      await repository.register(license)

      const spec = LicenseWithIdSpecification.withId(license.id)
      const value = license.toPrimitives().licensedUnits

      expect(await repository.aggregate(spec, 'sum', 'licensedUnits')).toBe(value)
      expect(await repository.aggregate(spec, 'avg', 'licensedUnits')).toBe(value)
      expect(await repository.aggregate(spec, 'max', 'licensedUnits')).toBe(value)
      expect(await repository.aggregate(spec, 'min', 'licensedUnits')).toBe(value)
      expect(await repository.aggregate(spec, 'distinct', 'licensedUnits')).toBe(1)

      const absent = LicenseWithIdSpecification.withId(LicenseId.create(uuidv7()))
      // la suma de nada es 0 y los distintos de nada son 0…
      expect(await repository.aggregate(absent, 'sum', 'licensedUnits')).toBe(0)
      expect(await repository.aggregate(absent, 'distinct', 'licensedUnits')).toBe(0)
      // …pero la media, el máximo y el mínimo de nada NO son 0: son «no hay dato»
      expect(await repository.aggregate(absent, 'avg', 'licensedUnits')).toBeNull()
      expect(await repository.aggregate(absent, 'max', 'licensedUnits')).toBeNull()
      expect(await repository.aggregate(absent, 'min', 'licensedUnits')).toBeNull()
    })

    it('devuelve un número, no la cadena que el motor pueda dar por un numeric', async () => {
      const license = LicenseMother.random()
      await repository.register(license)

      const sum = await repository.aggregate(LicenseWithIdSpecification.withId(license.id), 'sum', 'licensedUnits')

      expect(typeof sum).toBe('number')
    })
  })

  describe('aggregateGrouped (spec 72)', () => {
    it('desglosa en UNA consulta, con su clave y su valor', async () => {
      const license = LicenseMother.random()
      await repository.register(license)

      const groups = await repository.aggregateGrouped(LicenseWithIdSpecification.withId(license.id), {
        op: 'count',
        groupBy: 'contractId',
        limit: 50
      })

      expect(groups).toHaveLength(1)
      expect(groups[0].key).toBe(String(license.toPrimitives().contractId))
      expect(groups[0].value).toBe(1)
    })

    it('un conjunto vacío no tiene grupos: no los inventa a 0', async () => {
      const groups = await repository.aggregateGrouped(LicenseWithIdSpecification.withId(LicenseId.create(uuidv7())), {
        op: 'count',
        groupBy: 'contractId',
        limit: 50
      })

      expect(groups).toEqual([])
    })

    it('agrupa por mes con la clave YYYY-MM', async () => {
      const license = LicenseMother.random()
      await repository.register(license)

      const groups = await repository.aggregateGrouped(LicenseWithIdSpecification.withId(license.id), {
        op: 'count',
        bucketField: 'contractEndDate',
        limit: 50
      })

      // los meses vacíos los rellena el caso de uso: aquí solo vuelven los que tienen datos.
      // Un registro SIN fecha cae en el grupo '' (groupKeyOf(null)): también es contrato.
      for (const group of groups) {
        if (group.key !== '') expect(group.key).toMatch(/^\d{4}-\d{2}$/)
      }
    })
  })

  describe('save', () => {
    it('replaces the whole document instead of inserting a second one', async () => {
      const license = LicenseMother.random()
      await repository.register(license)

      await repository.save(license)

      expect(await repository.count(LicenseWithIdSpecification.withId(license.id))).toBe(1)
    })
  })
})
