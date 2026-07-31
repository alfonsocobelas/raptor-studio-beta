import { ExportSalesUseCase } from '../../../../../src/contexts/dealership/modules/sales/application/use-cases/export-sales-usecase.service'
import searchSaleConfig from '../../../../../src/contexts/dealership/modules/sales/application/config/search-sale-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { SaleMother } from '../../domain/mothers/sale.mother'
import { SaleRepositoryMock } from '../../mocks/sale.repository.mock'

describe('ExportSalesUseCase', () => {
  let repositoryMock: SaleRepositoryMock
  let useCase: ExportSalesUseCase

  beforeEach(() => {
    repositoryMock = new SaleRepositoryMock()
    useCase = new ExportSalesUseCase(repositoryMock)
  })

  it('returns every matching sale as primitives, without paginating', async () => {
    const sales = SaleMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(sales)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(sales[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportSalesUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchSaleConfig.searchableFields)
  })
})
