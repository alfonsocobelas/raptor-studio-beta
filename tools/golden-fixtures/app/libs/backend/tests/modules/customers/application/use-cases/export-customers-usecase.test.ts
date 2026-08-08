import { ExportCustomersUseCase } from '../../../../../src/contexts/sap-licensing/modules/customers/application/use-cases/export-customers-usecase.service'
import searchCustomerConfig from '../../../../../src/contexts/sap-licensing/modules/customers/application/config/search-customer-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { CustomerMother } from '../../domain/mothers/customer.mother'
import { CustomerRepositoryMock } from '../../mocks/customer.repository.mock'

describe('ExportCustomersUseCase', () => {
  let repositoryMock: CustomerRepositoryMock
  let useCase: ExportCustomersUseCase

  beforeEach(() => {
    repositoryMock = new CustomerRepositoryMock()
    useCase = new ExportCustomersUseCase(repositoryMock)
  })

  it('returns every matching customer as primitives, without paginating', async () => {
    const customers = CustomerMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(customers)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(customers[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportCustomersUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchCustomerConfig.searchableFields)
  })
})
