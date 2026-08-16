import { ExportPuntosUseCase } from '../../../../../src/contexts/aguas/modules/puntos/application/use-cases/export-puntos-usecase.service'
import searchPuntoConfig from '../../../../../src/contexts/aguas/modules/puntos/application/config/search-punto-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { PuntoMother } from '../../domain/mothers/punto.mother'
import { PuntoRepositoryMock } from '../../mocks/punto.repository.mock'

describe('ExportPuntosUseCase', () => {
  let repositoryMock: PuntoRepositoryMock
  let useCase: ExportPuntosUseCase

  beforeEach(() => {
    repositoryMock = new PuntoRepositoryMock()
    useCase = new ExportPuntosUseCase(repositoryMock)
  })

  it('returns every matching punto as primitives, without paginating', async () => {
    const puntos = PuntoMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(puntos)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(puntos[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportPuntosUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchPuntoConfig.searchableFields)
  })
})
