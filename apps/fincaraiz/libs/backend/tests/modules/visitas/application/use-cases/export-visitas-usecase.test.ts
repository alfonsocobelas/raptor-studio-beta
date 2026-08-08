import { ExportVisitasUseCase } from '../../../../../src/contexts/fincaraiz/modules/visitas/application/use-cases/export-visitas-usecase.service'
import searchVisitaConfig from '../../../../../src/contexts/fincaraiz/modules/visitas/application/config/search-visita-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { VisitaMother } from '../../domain/mothers/visita.mother'
import { VisitaRepositoryMock } from '../../mocks/visita.repository.mock'

describe('ExportVisitasUseCase', () => {
  let repositoryMock: VisitaRepositoryMock
  let useCase: ExportVisitasUseCase

  beforeEach(() => {
    repositoryMock = new VisitaRepositoryMock()
    useCase = new ExportVisitasUseCase(repositoryMock)
  })

  it('returns every matching visita as primitives, without paginating', async () => {
    const visitas = VisitaMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(visitas)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(visitas[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportVisitasUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchVisitaConfig.searchableFields)
  })
})
