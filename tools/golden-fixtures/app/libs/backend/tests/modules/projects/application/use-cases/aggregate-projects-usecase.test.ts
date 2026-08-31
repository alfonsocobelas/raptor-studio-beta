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

  // sin condicionar al modelo: contar filas vale para CUALQUIER recurso, y así la suite
  // nunca se emite vacía (jest trata una suite sin tests como fallo) — spec 76
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

    const result = await useCase.invoke({ op: 'count', groupBy: 'customerId' })

    expect(result.value).toBe(10)
    expect(result.groups).toHaveLength(2)
    expect(result.truncated).toBeUndefined()
  })

  it('rechaza agrupar por un campo que no está en la lista blanca', async () => {
    await expect(useCase.invoke({ op: 'count', groupBy: 'notAField' })).rejects.toThrow(InvalidArgumentError)
  })

  it('rechaza los dos ejes a la vez: una tabla cruzada es otra pregunta', async () => {
    await expect(
      useCase.invoke({ op: 'count', groupBy: 'customerId', bucket: 'month', bucketField: 'x' })
    ).rejects.toThrow(InvalidArgumentError)
  })

  it('la serie mensual empuja la ventana como filtros válidos (spec 76)', async () => {
    // el camino bucket construye filtros de ventana ADEMÁS de los del DTO: deben tener la
    // misma forma (Map) que los del pipe — un objeto plano moría en Filter.fromValues
    repositoryMock.givenCount(3)
    repositoryMock.givenAggregateGrouped([{ key: '2026-08', value: 3 }])

    const result = await useCase.invoke({
      op: 'count',
      bucket: 'month',
      bucketField: 'startDate',
      months: 3
    })

    expect(result.groups).toHaveLength(3)
    expect(result.groups?.every(group => /^\d{4}-\d{2}$/.test(group.key))).toBe(true)
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
