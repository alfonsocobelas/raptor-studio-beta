import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmLicenseRepository } from '../../../src/contexts/sap-licensing/modules/licenses/infrastructure/persistence/typeorm/typeorm-license.repository'
import { LicenseWithIdSpecification } from '../../../src/contexts/sap-licensing/modules/licenses/domain/specifications/license-with-id.specification'
import { LicenseId } from '../../../src/contexts/shared/domain/value-objects/licenses/license-id.vo'
import { DeleteOperationId } from '../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { LicenseMother } from '../../modules/licenses/domain/mothers/license.mother'

let repository: TypeOrmLicenseRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmLicenseRepository)
})

describe('TypeOrmLicenseRepository (integration)', () => {
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
  })

  describe('matching / exists / count', () => {
    it('matching returns the license selected by criteria', async () => {
      const license = LicenseMother.random()
      await repository.register(license)

      const results = await repository.matching(LicenseWithIdSpecification.withId(license.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(license.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
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
})
