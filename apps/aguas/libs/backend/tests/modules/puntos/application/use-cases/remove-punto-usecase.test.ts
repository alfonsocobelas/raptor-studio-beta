import { v7 as uuidv7 } from 'uuid'
import { RemovePuntoUseCase } from '../../../../../src/contexts/aguas/modules/puntos/application/use-cases/remove-punto-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { PuntoMother } from '../../domain/mothers/punto.mother'
import { PuntoRepositoryMock } from '../../mocks/punto.repository.mock'
import { TransactionManager } from '../../../../../src/contexts/shared/domain/persistence/transaction-manager'
import { MuestraRepository } from '../../../../../src/contexts/aguas/modules/muestras/domain/muestra-repository'

describe('RemovePuntoUseCase', () => {
  let repositoryMock: PuntoRepositoryMock
  let useCase: RemovePuntoUseCase

  // El árbol se marca dentro de la transacción: el manager de test la ejecuta tal cual,
  // y cada repo hijo es un stub — aquí se prueba la ORQUESTACIÓN, no la persistencia.
  const txManager = { runInTransaction: (work: () => Promise<unknown>) => work() } as TransactionManager
  const muestraRepository = { removeDraggedByPuntoId: jest.fn().mockResolvedValue([]) } as unknown as MuestraRepository
  beforeEach(() => {
    repositoryMock = new PuntoRepositoryMock()
    jest.clearAllMocks()
    useCase = new RemovePuntoUseCase(repositoryMock, muestraRepository, txManager)
  })

  describe('given the punto exists', () => {
    it('removes it', async () => {
      const punto = PuntoMother.random()
      repositoryMock.givenFound(punto)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: punto.id.value })

      repositoryMock.assertCalled('remove')
      expect(muestraRepository.removeDraggedByPuntoId).toHaveBeenCalled()
    })
  })

  describe('given the punto does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
