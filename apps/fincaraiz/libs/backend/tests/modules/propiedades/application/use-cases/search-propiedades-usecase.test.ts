import { SearchPropiedadesUseCase } from '../../../../../src/contexts/fincaraiz/modules/propiedades/application/use-cases/search-propiedades-usecase.service'
import searchPropiedadConfig from '../../../../../src/contexts/fincaraiz/modules/propiedades/application/config/search-propiedad-config'
import { OffsetInput } from '../../../../../src/contexts/shared/domain/query/criteria'
import { PropiedadMother } from '../../domain/mothers/propiedad.mother'
import { PropiedadRepositoryMock } from '../../mocks/propiedad.repository.mock'

describe('SearchPropiedadesUseCase', () => {
  let repositoryMock: PropiedadRepositoryMock
  let useCase: SearchPropiedadesUseCase

  const baseInput: OffsetInput = { page: 1, pageSize: 10 }

  beforeEach(() => {
    repositoryMock = new PropiedadRepositoryMock()
    useCase = new SearchPropiedadesUseCase(repositoryMock)
  })

  it('returns a paginated list with correct metadata', async () => {
    const propiedades = PropiedadMother.randomList(3)
    repositoryMock.givenMatching(propiedades)
    repositoryMock.givenCount(3)

    const result = await useCase.invoke(baseInput)

    expect(result.total).toBe(3)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.totalPages).toBe(1)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual(propiedades[0].toPrimitives())
  })

  it('calculates totalPages across multiple pages', async () => {
    repositoryMock.givenMatching(PropiedadMother.randomList(10))
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
    expect(criteria.search?.fields).toEqual(searchPropiedadConfig.searchableFields)
  })
})
