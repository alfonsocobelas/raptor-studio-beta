import { AggregateCustomersUseCase } from '../../../../../src/contexts/sap-licensing/modules/customers/application/use-cases/aggregate-customers-usecase.service'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { CustomerRepositoryMock } from '../../mocks/customer.repository.mock'

/**
 * El caso de uso es la FRONTERA DE CONFIANZA de la agregación (spec 71): el nombre del campo llega
 * por HTTP y acaba interpolado en la consulta. Lo que se prueba aquí no es la aritmética —eso es
 * del repositorio— sino que nada fuera de la lista blanca llega abajo.
 */
describe('AggregateCustomersUseCase', () => {
  let repositoryMock: CustomerRepositoryMock
  let useCase: AggregateCustomersUseCase

  beforeEach(() => {
    repositoryMock = new CustomerRepositoryMock()
    useCase = new AggregateCustomersUseCase(repositoryMock)
  })

  it('rechaza sumar o promediar una fecha: no es una pregunta con respuesta', async () => {
    await expect(useCase.invoke({ op: 'sum', field: 'archivedAt' })).rejects.toThrow(InvalidArgumentError)
    await expect(useCase.invoke({ op: 'avg', field: 'archivedAt' })).rejects.toThrow(InvalidArgumentError)
  })

  it('acepta el máximo de una fecha: «la última visita» sí es una pregunta', async () => {
    repositoryMock.givenAggregate(1)

    await expect(useCase.invoke({ op: 'max', field: 'archivedAt' })).resolves.toEqual({ value: 1 })
  })
})
