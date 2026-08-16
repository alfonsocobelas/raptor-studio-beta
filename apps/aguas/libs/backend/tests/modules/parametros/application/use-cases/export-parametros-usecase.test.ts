import { ExportParametrosUseCase } from '../../../../../src/contexts/aguas/modules/parametros/application/use-cases/export-parametros-usecase.service'
import searchParametroConfig from '../../../../../src/contexts/aguas/modules/parametros/application/config/search-parametro-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { ParametroMother } from '../../domain/mothers/parametro.mother'
import { ParametroRepositoryMock } from '../../mocks/parametro.repository.mock'

describe('ExportParametrosUseCase', () => {
  let repositoryMock: ParametroRepositoryMock
  let useCase: ExportParametrosUseCase

  beforeEach(() => {
    repositoryMock = new ParametroRepositoryMock()
    useCase = new ExportParametrosUseCase(repositoryMock)
  })

  it('returns every matching parametro as primitives, without paginating', async () => {
    const parametros = ParametroMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(parametros)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(parametros[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportParametrosUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchParametroConfig.searchableFields)
  })
})
