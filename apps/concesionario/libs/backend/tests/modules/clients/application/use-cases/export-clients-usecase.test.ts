import { ExportClientsUseCase } from '../../../../../src/contexts/dealership/modules/clients/application/use-cases/export-clients-usecase.service'
import searchClientConfig from '../../../../../src/contexts/dealership/modules/clients/application/config/search-client-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { ClientMother } from '../../domain/mothers/client.mother'
import { ClientRepositoryMock } from '../../mocks/client.repository.mock'

describe('ExportClientsUseCase', () => {
  let repositoryMock: ClientRepositoryMock
  let useCase: ExportClientsUseCase

  beforeEach(() => {
    repositoryMock = new ClientRepositoryMock()
    useCase = new ExportClientsUseCase(repositoryMock)
  })

  it('returns every matching client as primitives, without paginating', async () => {
    const clients = ClientMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(clients)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(clients[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportClientsUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchClientConfig.searchableFields)
  })
})
