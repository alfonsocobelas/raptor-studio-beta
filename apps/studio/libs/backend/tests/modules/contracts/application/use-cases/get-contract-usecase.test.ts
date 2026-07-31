import { v7 as uuidv7 } from 'uuid'
import { GetContractUseCase } from '../../../../../src/contexts/sap-licensing/modules/contracts/application/use-cases/get-contract-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { ContractMother } from '../../domain/mothers/contract.mother'
import { ContractRepositoryMock } from '../../mocks/contract.repository.mock'

describe('GetContractUseCase', () => {
  let repositoryMock: ContractRepositoryMock
  let useCase: GetContractUseCase

  beforeEach(() => {
    repositoryMock = new ContractRepositoryMock()
    useCase = new GetContractUseCase(repositoryMock)
  })

  describe('given the contract exists', () => {
    it('returns its primitives', async () => {
      const contract = ContractMother.random()
      repositoryMock.givenFound(contract)

      const result = await useCase.invoke({ id: contract.id.value })

      expect(result).toEqual(contract.toPrimitives())
    })
  })

  describe('given the contract does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
