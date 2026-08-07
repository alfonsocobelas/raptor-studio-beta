import { v7 as uuidv7 } from 'uuid'
import { GetCustomerUseCase } from '../../../../../src/contexts/sap-licensing/modules/customers/application/use-cases/get-customer-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { CustomerMother } from '../../domain/mothers/customer.mother'
import { CustomerRepositoryMock } from '../../mocks/customer.repository.mock'

describe('GetCustomerUseCase', () => {
  let repositoryMock: CustomerRepositoryMock
  let useCase: GetCustomerUseCase

  beforeEach(() => {
    repositoryMock = new CustomerRepositoryMock()
    useCase = new GetCustomerUseCase(repositoryMock)
  })

  describe('given the customer exists', () => {
    it('returns its primitives', async () => {
      const customer = CustomerMother.random()
      repositoryMock.givenFound(customer)

      const result = await useCase.invoke({ id: customer.id.value })

      expect(result).toEqual({
        ...customer.toPrimitives(),
        contacts: customer.contacts.map(child => child.toPrimitives())
      })
    })
  })

  describe('given the customer does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
