import { ExportContractsUseCase } from '../../../../../src/contexts/sap-licensing/modules/contracts/application/use-cases/export-contracts-usecase.service'
import searchContractConfig from '../../../../../src/contexts/sap-licensing/modules/contracts/application/config/search-contract-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { ContractMother } from '../../domain/mothers/contract.mother'
import { ContractRepositoryMock } from '../../mocks/contract.repository.mock'

describe('ExportContractsUseCase', () => {
  let repositoryMock: ContractRepositoryMock
  let useCase: ExportContractsUseCase

  beforeEach(() => {
    repositoryMock = new ContractRepositoryMock()
    useCase = new ExportContractsUseCase(repositoryMock)
  })

  it('returns every matching contract as primitives, without paginating', async () => {
    const contracts = ContractMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(contracts)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(contracts[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportContractsUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchContractConfig.searchableFields)
  })
})
