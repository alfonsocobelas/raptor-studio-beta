import { ExportClientesUseCase } from '../../../../../src/contexts/aguas/modules/clientes/application/use-cases/export-clientes-usecase.service'
import searchClienteConfig from '../../../../../src/contexts/aguas/modules/clientes/application/config/search-cliente-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { ClienteMother } from '../../domain/mothers/cliente.mother'
import { ClienteRepositoryMock } from '../../mocks/cliente.repository.mock'

describe('ExportClientesUseCase', () => {
  let repositoryMock: ClienteRepositoryMock
  let useCase: ExportClientesUseCase

  beforeEach(() => {
    repositoryMock = new ClienteRepositoryMock()
    useCase = new ExportClientesUseCase(repositoryMock)
  })

  it('returns every matching cliente as primitives, without paginating', async () => {
    const clientes = ClienteMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(clientes)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(clientes[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportClientesUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchClienteConfig.searchableFields)
  })
})
