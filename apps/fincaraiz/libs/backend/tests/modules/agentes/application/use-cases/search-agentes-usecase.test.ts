import { SearchAgentesUseCase } from '../../../../../src/contexts/fincaraiz/modules/agentes/application/use-cases/search-agentes-usecase.service'
import searchAgenteConfig from '../../../../../src/contexts/fincaraiz/modules/agentes/application/config/search-agente-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { AgenteMother } from '../../domain/mothers/agente.mother'
import { AgenteRepositoryMock } from '../../mocks/agente.repository.mock'

describe('SearchAgentesUseCase', () => {
  let repositoryMock: AgenteRepositoryMock
  let useCase: SearchAgentesUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new AgenteRepositoryMock()
    useCase = new SearchAgentesUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const agentes = AgenteMother.randomList(3)
    repositoryMock.givenMatching(agentes)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(agentes[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(AgenteMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchAgenteConfig.searchableFields)
  })
})
