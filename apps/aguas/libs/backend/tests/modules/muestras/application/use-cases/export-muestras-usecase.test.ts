import { ExportMuestrasUseCase } from '../../../../../src/contexts/aguas/modules/muestras/application/use-cases/export-muestras-usecase.service'
import searchMuestraConfig from '../../../../../src/contexts/aguas/modules/muestras/application/config/search-muestra-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { MuestraMother } from '../../domain/mothers/muestra.mother'
import { MuestraRepositoryMock } from '../../mocks/muestra.repository.mock'

describe('ExportMuestrasUseCase', () => {
  let repositoryMock: MuestraRepositoryMock
  let useCase: ExportMuestrasUseCase

  beforeEach(() => {
    repositoryMock = new MuestraRepositoryMock()
    useCase = new ExportMuestrasUseCase(repositoryMock)
  })

  it('returns every matching muestra as primitives, without paginating', async () => {
    const muestras = MuestraMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(muestras)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(muestras[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportMuestrasUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchMuestraConfig.searchableFields)
  })
})
