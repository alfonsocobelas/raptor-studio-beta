import { AggregateProjectsUseCase } from '../../../../../src/contexts/sap-licensing/modules/projects/application/use-cases/aggregate-projects-usecase.service'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { ProjectRepositoryMock } from '../../mocks/project.repository.mock'

/**
 * El caso de uso es la FRONTERA DE CONFIANZA de la agregación (spec 71): el nombre del campo llega
 * por HTTP y acaba interpolado en la consulta. Lo que se prueba aquí no es la aritmética —eso es
 * del repositorio— sino que nada fuera de la lista blanca llega abajo.
 */
describe('AggregateProjectsUseCase', () => {
  let repositoryMock: ProjectRepositoryMock
  let useCase: AggregateProjectsUseCase

  beforeEach(() => {
    repositoryMock = new ProjectRepositoryMock()
    useCase = new AggregateProjectsUseCase(repositoryMock)
  })

  it('rechaza sumar o promediar una fecha: no es una pregunta con respuesta', async () => {
    await expect(useCase.invoke({ op: 'sum', field: 'startDate' })).rejects.toThrow(InvalidArgumentError)
    await expect(useCase.invoke({ op: 'avg', field: 'startDate' })).rejects.toThrow(InvalidArgumentError)
  })

  it('acepta el máximo de una fecha: «la última visita» sí es una pregunta', async () => {
    repositoryMock.givenAggregate(1)

    await expect(useCase.invoke({ op: 'max', field: 'startDate' })).resolves.toEqual({ value: 1 })
  })
})
