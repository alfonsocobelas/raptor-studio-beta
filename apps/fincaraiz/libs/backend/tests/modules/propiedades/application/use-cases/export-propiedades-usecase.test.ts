import { ExportPropiedadesUseCase } from '../../../../../src/contexts/fincaraiz/modules/propiedades/application/use-cases/export-propiedades-usecase.service'
import searchPropiedadConfig from '../../../../../src/contexts/fincaraiz/modules/propiedades/application/config/search-propiedad-config'
import { ExportTooLargeError } from '../../../../../src/contexts/shared/domain/errors'
import { PropiedadMother } from '../../domain/mothers/propiedad.mother'
import { PropiedadRepositoryMock } from '../../mocks/propiedad.repository.mock'

describe('ExportPropiedadesUseCase', () => {
  let repositoryMock: PropiedadRepositoryMock
  let useCase: ExportPropiedadesUseCase

  beforeEach(() => {
    repositoryMock = new PropiedadRepositoryMock()
    useCase = new ExportPropiedadesUseCase(repositoryMock)
  })

  it('returns every matching propiedad as primitives, without paginating', async () => {
    const propiedades = PropiedadMother.randomList(3)
    repositoryMock.givenCount(3)
    repositoryMock.givenMatching(propiedades)

    const rows = await useCase.invoke({})

    expect(rows).toHaveLength(3)
    expect(rows[0]).toEqual(propiedades[0].toPrimitives())
  })

  it('checks the count first and throws ExportTooLargeError without loading rows', async () => {
    useCase = new ExportPropiedadesUseCase(repositoryMock, 2)
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
    expect(criteria.search?.fields).toEqual(searchPropiedadConfig.searchableFields)
  })
})
