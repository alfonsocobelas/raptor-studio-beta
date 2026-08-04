import { SearchCustomersUseCase } from '../../../../../src/contexts/sap-licensing/modules/customers/application/use-cases/search-customers-usecase.service'
import searchCustomerConfig from '../../../../../src/contexts/sap-licensing/modules/customers/application/config/search-customer-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { CustomerMother } from '../../domain/mothers/customer.mother'
import { CustomerRepositoryMock } from '../../mocks/customer.repository.mock'

describe('SearchCustomersUseCase', () => {
  let repositoryMock: CustomerRepositoryMock
  let useCase: SearchCustomersUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new CustomerRepositoryMock()
    useCase = new SearchCustomersUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const customers = CustomerMother.randomList(3)
    repositoryMock.givenMatching(customers)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(customers[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(CustomerMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchCustomerConfig.searchableFields)
  })
})
