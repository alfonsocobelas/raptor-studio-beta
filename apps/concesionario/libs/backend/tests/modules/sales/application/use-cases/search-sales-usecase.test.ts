import { SearchSalesUseCase } from '../../../../../src/contexts/dealership/modules/sales/application/use-cases/search-sales-usecase.service'
import searchSaleConfig from '../../../../../src/contexts/dealership/modules/sales/application/config/search-sale-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { SaleMother } from '../../domain/mothers/sale.mother'
import { SaleRepositoryMock } from '../../mocks/sale.repository.mock'

describe('SearchSalesUseCase', () => {
  let repositoryMock: SaleRepositoryMock
  let useCase: SearchSalesUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new SaleRepositoryMock()
    useCase = new SearchSalesUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const sales = SaleMother.randomList(3)
    repositoryMock.givenMatching(sales)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(sales[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(SaleMother.randomList(10))
    repositoryMock.givenCount(25)

    const result = await useCase.invoke({ page: 2, pageSize: 10 })

    expect(result.total).toBe(25)
    expect(result.totalPages).toBe(3)
  })

  it('builds the criteria with the search over the module searchable fields', async () => {
    repositoryMock.givenMatching([])
    repositoryMock.givenCount(0)

    await useCase.invoke({ ...baseInput, search: 'anything' })

    const criteria = repositoryMock.matchingCriteria()
    expect(criteria.hasSearch()).toBe(true)
    expect(criteria.search?.fields).toEqual(searchSaleConfig.searchableFields)
  })
})
