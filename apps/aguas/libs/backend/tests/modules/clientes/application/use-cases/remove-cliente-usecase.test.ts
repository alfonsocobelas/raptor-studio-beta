import { v7 as uuidv7 } from 'uuid'
import { RemoveClienteUseCase } from '../../../../../src/contexts/aguas/modules/clientes/application/use-cases/remove-cliente-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ClienteMother } from '../../domain/mothers/cliente.mother'
import { ClienteRepositoryMock } from '../../mocks/cliente.repository.mock'
import { TransactionManager } from '../../../../../src/contexts/shared/domain/persistence/transaction-manager'
import { PuntoRepository } from '../../../../../src/contexts/aguas/modules/puntos/domain/punto-repository'
import { MuestraRepository } from '../../../../../src/contexts/aguas/modules/muestras/domain/muestra-repository'

describe('RemoveClienteUseCase', () => {
  let repositoryMock: ClienteRepositoryMock
  let useCase: RemoveClienteUseCase

  // El árbol se marca dentro de la transacción: el manager de test la ejecuta tal cual,
  // y cada repo hijo es un stub — aquí se prueba la ORQUESTACIÓN, no la persistencia.
  const txManager = { runInTransaction: (work: () => Promise<unknown>) => work() } as TransactionManager
  const puntoRepository = { removeDraggedByClienteId: jest.fn().mockResolvedValue([]) } as unknown as PuntoRepository
  const muestraRepository = { removeDraggedByPuntoId: jest.fn().mockResolvedValue([]) } as unknown as MuestraRepository
  beforeEach(() => {
    repositoryMock = new ClienteRepositoryMock()
    jest.clearAllMocks()
    useCase = new RemoveClienteUseCase(repositoryMock, puntoRepository, muestraRepository, txManager)
  })

  describe('given the cliente exists', () => {
    it('removes it', async () => {
      const cliente = ClienteMother.random()
      repositoryMock.givenFound(cliente)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: cliente.id.value })

      repositoryMock.assertCalled('remove')
      expect(puntoRepository.removeDraggedByClienteId).toHaveBeenCalled()
      expect(muestraRepository.removeDraggedByPuntoId).toHaveBeenCalled()
    })
  })

  describe('given the cliente does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
