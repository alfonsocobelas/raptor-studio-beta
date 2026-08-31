import { v7 as uuidv7 } from 'uuid'
import { AddContactUseCase } from '../../../../../src/contexts/sap-licensing/modules/customers/application/use-cases/add-contact-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { TransactionManager } from '../../../../../src/contexts/shared/domain/persistence/transaction-manager'
import { CustomerMother } from '../../domain/mothers/customer.mother'
import { CustomerRepositoryMock } from '../../mocks/customer.repository.mock'

describe('AddContactUseCase', () => {
  let repositoryMock: CustomerRepositoryMock
  let useCase: AddContactUseCase
  // el cuerpo del caso de uso vive DENTRO de la transacción: un doble que no ejecutase el
  // trabajo dejaría pasar estos tests sin correr una sola línea de lo que afirman
  const txManager = {
    runInTransaction: jest.fn(<T>(work: () => Promise<T>) => work())
  } as unknown as TransactionManager

  const contact = {
    id: uuidv7(),
    name: 'Name 1',
    role: '',
    email: '',
    phone: '',
    isPrimary: false
  }

  beforeEach(() => {
    repositoryMock = new CustomerRepositoryMock()
    useCase = new AddContactUseCase(repositoryMock, txManager)
  })

  describe('given the customer does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ customerId: uuidv7(), contact })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an existing customer', () => {
    it('adds the contact to the collection and saves once', async () => {
      const parent = CustomerMother.reconstruct()
      repositoryMock.givenFound(parent)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({ customerId: parent.id.value, contact })

      expect(parent.contacts).toHaveLength(1)
      repositoryMock.assertCalledTimes('save', 1)
    })
  })
})
