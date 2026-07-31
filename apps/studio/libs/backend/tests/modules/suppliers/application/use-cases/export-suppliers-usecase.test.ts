import { ExportSuppliersUseCase } from '../../../../../src/contexts/warehouse/modules/suppliers/application/use-cases/export-suppliers-usecase.service'
import searchSupplierConfig from '../../../../../src/contexts/warehouse/modules/suppliers/application/config/search-supplier-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { SupplierMother } from '../../domain/mothers/supplier.mother'
import { SupplierRepositoryMock } from '../../mocks/supplier.repository.mock'

describe('ExportSuppliersUseCase', () => {
  let repositoryMock: SupplierRepositoryMock
  let useCase: ExportSuppliersUseCase

  beforeEach(() => {
    repositoryMock = new SupplierRepositoryMock()
    useCase = new ExportSuppliersUseCase(repositoryMock)
  })

  it('returns every matching supplier as primitives, without paginating', async () => {
    const suppliers = SupplierMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(suppliers)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(suppliers[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportSuppliersUseCase(repositoryMock, 2)
    repositoryMock.givenCount(3)

    await expect(useCase.invoke({})).rejects.toBeInstanceOf(ExportTooLargeError)
    repositoryMock.assertNotCalled('matching')
  })

  it('builds the criteria with the search over the module searchable fields', async () => {
    repositoryMock.givenCount(0)
    repositoryMock.givenMatching([])

    await useCase.invoke({ search: 'anything' })

    const criteria = repositoryMock.matchingCriteria()
    expect(criteria.hasSearch()).toBe(true)
    expect(criteria.search?.fields).toEqual(searchSupplierConfig.searchableFields)
  })
})
