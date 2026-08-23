import { v7 as uuidv7 } from 'uuid'
import { UpdateContractUseCase } from '../../../../../src/contexts/sap-licensing/modules/contracts/application/use-cases/update-contract-usecase.service'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { CustomerRepository } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/customer-repository'
import { ContractMother } from '../../domain/mothers/contract.mother'
import { ContractRepositoryMock } from '../../mocks/contract.repository.mock'

describe('UpdateContractUseCase', () => {
  let repositoryMock: ContractRepositoryMock
  let useCase: UpdateContractUseCase
  const customerRepository = { get: jest.fn() } as unknown as CustomerRepository

  beforeEach(() => {
    repositoryMock = new ContractRepositoryMock()
    ;(customerRepository.get as jest.Mock).mockReset()
    ;(customerRepository.get as jest.Mock).mockResolvedValue({
      name: { value: ContractMother.primitives().customerName }
    })
    useCase = new UpdateContractUseCase(repositoryMock, customerRepository)
  })

  describe('given the contract does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7(), updates: {} })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an update that touches no unique field', () => {
    it('saves without checking uniqueness', async () => {
      repositoryMock.givenFound(ContractMother.reconstruct())
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })

  describe('given contractNumber changes', () => {
    it('re-validates uniqueness and saves when the new value is free', async () => {
      const current = ContractMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.givenDoesNotExist()
      repositoryMock.whenSaveSuccess()

      // los valores de la mother son aleatorios: uno nuevo difiere del actual
      await useCase.invoke({
        id: current.id.value,
        updates: { contractNumber: ContractMother.primitives().contractNumber }
      })

      repositoryMock.assertCalledTimes('exists', 1)
      repositoryMock.assertCalled('save')
    })

    it('throws AlreadyExistsError and does not save when the new value is taken', async () => {
      repositoryMock.givenFound(ContractMother.reconstruct())
      repositoryMock.givenAlreadyExists()

      await expect(
        useCase.invoke({ id: uuidv7(), updates: { contractNumber: ContractMother.primitives().contractNumber } })
      ).rejects.toThrow(AlreadyExistsError)
      repositoryMock.assertNotCalled('save')
    })

    it('saves without checking uniqueness when the provided value is unchanged', async () => {
      const current = ContractMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ id: current.id.value, updates: { contractNumber: current.toPrimitives().contractNumber } })

      repositoryMock.assertNotCalled('exists')
      repositoryMock.assertCalled('save')
    })
  })

  describe('given customerId changes (denormalización, spec 60)', () => {
    it('refresca customerName con el valor canónico del nuevo origen', async () => {
      const current = ContractMother.reconstruct()
      repositoryMock.givenFound(current)
      repositoryMock.whenSaveSuccess()
      const canonical = ContractMother.primitives().customerName
      ;(customerRepository.get as jest.Mock).mockResolvedValue({ name: { value: canonical } })

      await useCase.invoke({ id: current.id.value, updates: { customerId: uuidv7() } })

      repositoryMock.assertCalled('save')
      expect(current.toPrimitives().customerName).toBe(canonical)
    })

    it('falla con EntityNotFoundError si el nuevo FK no existe y no guarda', async () => {
      repositoryMock.givenFound(ContractMother.reconstruct())
      ;(customerRepository.get as jest.Mock).mockResolvedValue(null)

      await expect(useCase.invoke({ id: uuidv7(), updates: { customerId: uuidv7() } })).rejects.toThrow(
        EntityNotFoundError
      )
      repositoryMock.assertNotCalled('save')
    })

    it('no consulta el origen si el FK no viene en updates', async () => {
      repositoryMock.givenFound(ContractMother.reconstruct())
      repositoryMock.whenSaveSuccess()
      ;(customerRepository.get as jest.Mock).mockClear()

      await useCase.invoke({ id: uuidv7(), updates: {} })

      expect(customerRepository.get as jest.Mock).not.toHaveBeenCalled()
    })
  })
})
