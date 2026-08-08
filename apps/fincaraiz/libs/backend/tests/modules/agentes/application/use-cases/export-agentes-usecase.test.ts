import { ExportAgentesUseCase } from '../../../../../src/contexts/fincaraiz/modules/agentes/application/use-cases/export-agentes-usecase.service'
import searchAgenteConfig from '../../../../../src/contexts/fincaraiz/modules/agentes/application/config/search-agente-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { AgenteMother } from '../../domain/mothers/agente.mother'
import { AgenteRepositoryMock } from '../../mocks/agente.repository.mock'

describe('ExportAgentesUseCase', () => {
  let repositoryMock: AgenteRepositoryMock
  let useCase: ExportAgentesUseCase

  beforeEach(() => {
    repositoryMock = new AgenteRepositoryMock()
    useCase = new ExportAgentesUseCase(repositoryMock)
  })

  it('returns every matching agente as primitives, without paginating', async () => {
    const agentes = AgenteMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(agentes)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(agentes[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportAgentesUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchAgenteConfig.searchableFields)
  })
})
