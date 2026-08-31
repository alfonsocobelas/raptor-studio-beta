import { v7 as uuidv7 } from 'uuid'
import { ExpireContractUseCase } from '../../../../../src/contexts/sap-licensing/modules/contracts/application/use-cases/expire-contract-usecase.service'
import { ConcurrencyConflictError, EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ContractMother } from '../../domain/mothers/contract.mother'
import { ContractRepositoryMock } from '../../mocks/contract.repository.mock'

/** Transición «Expirar»: expiring → expired. */
describe('ExpireContractUseCase', () => {
  let repositoryMock: ContractRepositoryMock
  let useCase: ExpireContractUseCase

  beforeEach(() => {
    repositoryMock = new ContractRepositoryMock()
    useCase = new ExpireContractUseCase(repositoryMock)
  })

  describe('given the contract does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), version: 1 })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given a stale version (bloqueo optimista, spec 78)', () => {
    it('throws ConcurrencyConflictError and does not mutate nor save', async () => {
      const current = ContractMother.reconstruct({ status: 'expiring' })
      repositoryMock.givenFound(current)
      const before = current.toPrimitives()

      await expect(useCase.invoke({ id: current.id.value, version: 99 })).rejects.toThrow(ConcurrencyConflictError)

      repositoryMock.assertNotCalled('save')
      expect(current.toPrimitives()).toEqual(before)
    })
  })

  describe('given a legal source state', () => {
    it('moves the contract to expired and saves it once', async () => {
      const current = ContractMother.reconstruct({ status: 'expiring' })
      repositoryMock.givenFound(current)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: current.id.value, version: current.version })

      expect(current.toPrimitives().status).toBe('expired')
      repositoryMock.assertCalledTimes('save', 1)
    })
  })

  describe('given an illegal source state', () => {
    it('rejects the transition from active and does not save', async () => {
      const current = ContractMother.reconstruct({ status: 'active' })
      repositoryMock.givenFound(current)

      await expect(useCase.invoke({ id: current.id.value, version: current.version })).rejects.toThrow()

      expect(current.toPrimitives().status).toBe('active')
      repositoryMock.assertNotCalled('save')
    })
  })
})
