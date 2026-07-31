import { SearchContractsUseCase } from '../../../../../src/contexts/sap-licensing/modules/contracts/application/use-cases/search-contracts-usecase.service'
import searchContractConfig from '../../../../../src/contexts/sap-licensing/modules/contracts/application/config/search-contract-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { ContractMother } from '../../domain/mothers/contract.mother'
import { ContractRepositoryMock } from '../../mocks/contract.repository.mock'

describe('SearchContractsUseCase', () => {
  let repositoryMock: ContractRepositoryMock
  let useCase: SearchContractsUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new ContractRepositoryMock()
    useCase = new SearchContractsUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const contracts = ContractMother.randomList(3)
    repositoryMock.givenMatching(contracts)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(contracts[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(ContractMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchContractConfig.searchableFields)
  })
})
