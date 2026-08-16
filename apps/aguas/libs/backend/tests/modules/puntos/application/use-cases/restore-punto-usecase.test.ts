import { v7 as uuidv7 } from 'uuid'
import { RestorePuntoUseCase } from '../../../../../src/contexts/aguas/modules/puntos/application/use-cases/restore-punto-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { DeleteOperationId } from '../../../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { TransactionManager } from '../../../../../src/contexts/shared/domain/persistence/transaction-manager'
import { MuestraRepository } from '../../../../../src/contexts/aguas/modules/muestras/domain/muestra-repository'
import { PuntoRepositoryMock } from '../../mocks/punto.repository.mock'

describe('RestorePuntoUseCase', () => {
  let repositoryMock: PuntoRepositoryMock
  let useCase: RestorePuntoUseCase
  // Se prueba la ORQUESTACIÓN: la transacción se ejecuta tal cual y cada repo hijo es un stub
  const txManager = { runInTransaction: (work: () => Promise<unknown>) => work() } as TransactionManager
  const muestraRepository = { restoreByOp: jest.fn().mockResolvedValue(0) } as unknown as MuestraRepository

  beforeEach(() => {
    repositoryMock = new PuntoRepositoryMock()
    jest.clearAllMocks()
    useCase = new RestorePuntoUseCase(repositoryMock, muestraRepository, txManager)
  })

  describe('given a soft-deleted punto', () => {
    it('reverts its whole delete operation, level by level', async () => {
      const op = DeleteOperationId.random()
      repositoryMock.givenDeletedOp(op)
      repositoryMock.whenRestoreByOpSucceeds()

      await useCase.invoke({ id: uuidv7() })

      repositoryMock.assertCalled('restoreByOp')
      expect(muestraRepository.restoreByOp).toHaveBeenCalledWith(op)
    })
  })

  describe('given nothing deleted under that id', () => {
    it('throws EntityNotFoundError and touches nothing', async () => {
      repositoryMock.givenDeletedOp(null)

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('restoreByOp')
    })
  })
})
