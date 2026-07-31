import { v7 as uuidv7 } from 'uuid'
import { GetLicenseUseCase } from '../../../../../src/contexts/sap-licensing/modules/licenses/application/use-cases/get-license-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { LicenseMother } from '../../domain/mothers/license.mother'
import { LicenseRepositoryMock } from '../../mocks/license.repository.mock'

describe('GetLicenseUseCase', () => {
  let repositoryMock: LicenseRepositoryMock
  let useCase: GetLicenseUseCase

  beforeEach(() => {
    repositoryMock = new LicenseRepositoryMock()
    useCase = new GetLicenseUseCase(repositoryMock)
  })

  describe('given the license exists', () => {
    it('returns its primitives', async () => {
      const license = LicenseMother.random()
      repositoryMock.givenFound(license)

      const result = await useCase.invoke({ id: license.id.value })

      expect(result).toEqual(license.toPrimitives())
    })
  })

  describe('given the license does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
