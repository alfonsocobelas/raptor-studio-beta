import { AggregateContractsUseCase } from '../../../../../src/contexts/sap-licensing/modules/contracts/application/use-cases/aggregate-contracts-usecase.service'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { ContractRepositoryMock } from '../../mocks/contract.repository.mock'

/**
 * El caso de uso es la FRONTERA DE CONFIANZA de la agregación (spec 71): el nombre del campo llega
 * por HTTP y acaba interpolado en la consulta. Lo que se prueba aquí no es la aritmética —eso es
 * del repositorio— sino que nada fuera de la lista blanca llega abajo.
 */
describe('AggregateContractsUseCase', () => {
  let repositoryMock: ContractRepositoryMock
  let useCase: AggregateContractsUseCase

  beforeEach(() => {
    repositoryMock = new ContractRepositoryMock()
    useCase = new AggregateContractsUseCase(repositoryMock)
  })

  it('devuelve el valor que da el repositorio', async () => {
    repositoryMock.givenAggregate(42)

    const result = await useCase.invoke({ op: 'sum', field: 'nbrOfContracts' })

    expect(result).toEqual({ value: 42 })
  })

  it('propaga el «no hay dato» sin convertirlo en cero', async () => {
    repositoryMock.givenAggregate(null)

    const result = await useCase.invoke({ op: 'avg', field: 'nbrOfContracts' })

    expect(result).toEqual({ value: null })
  })

  it('rechaza un campo que no está en la lista blanca, sin bajar al repositorio', async () => {
    await expect(useCase.invoke({ op: 'sum', field: 'notAField' })).rejects.toThrow(InvalidArgumentError)
  })

  it('rechaza una inyección por el nombre del campo', async () => {
    await expect(useCase.invoke({ op: 'sum', field: 'nbrOfContracts) FROM users; --' })).rejects.toThrow(
      InvalidArgumentError
    )
  })

  it('rechaza una operación que no existe', async () => {
    await expect(useCase.invoke({ op: 'median', field: 'nbrOfContracts' })).rejects.toThrow(InvalidArgumentError)
  })

  it('cuenta sin campo: contar filas no mide ninguna columna (spec 72)', async () => {
    repositoryMock.givenCount(7)

    await expect(useCase.invoke({ op: 'count' })).resolves.toEqual({ value: 7 })
  })

  it('desglosa y devuelve el total en la misma respuesta', async () => {
    repositoryMock.givenCount(10)
    repositoryMock.givenAggregateGrouped([
      { key: 'a', value: 6 },
      { key: 'b', value: 4 }
    ])

    const result = await useCase.invoke({ op: 'count', groupBy: 'contractType' })

    expect(result.value).toBe(10)
    expect(result.groups).toHaveLength(2)
    expect(result.truncated).toBeUndefined()
  })

  it('rechaza agrupar por un campo que no está en la lista blanca', async () => {
    await expect(useCase.invoke({ op: 'count', groupBy: 'notAField' })).rejects.toThrow(InvalidArgumentError)
  })

  it('rechaza los dos ejes a la vez: una tabla cruzada es otra pregunta', async () => {
    await expect(
      useCase.invoke({ op: 'count', groupBy: 'contractType', bucket: 'month', bucketField: 'x' })
    ).rejects.toThrow(InvalidArgumentError)
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
