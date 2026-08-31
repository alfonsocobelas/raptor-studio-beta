import { v7 as uuidv7 } from 'uuid'
import { UpdateContactUseCase } from '../../../../../src/contexts/sap-licensing/modules/customers/application/use-cases/update-contact-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { TransactionManager } from '../../../../../src/contexts/shared/domain/persistence/transaction-manager'
import { CustomerMother } from '../../domain/mothers/customer.mother'
import { CustomerRepositoryMock } from '../../mocks/customer.repository.mock'

describe('UpdateContactUseCase', () => {
  let repositoryMock: CustomerRepositoryMock
  let useCase: UpdateContactUseCase
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

  /** El padre nace sin hijos, así que el estado de partida se prepara con la API del dominio. */
  const parentWithChild = () => {
    const parent = CustomerMother.reconstruct()
    parent.addContact(contact)
    return parent
  }

  beforeEach(() => {
    repositoryMock = new CustomerRepositoryMock()
    useCase = new UpdateContactUseCase(repositoryMock, txManager)
  })

  describe('given the customer does not exist', () => {
    it('throws EntityNotFoundError and does not save', async () => {
      repositoryMock.givenNotFound()

      await expect(
        useCase.invoke({
          customerId: uuidv7(),
          contactId: contact.id,
          updates: {}
        })
      ).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('save')
    })
  })

  describe('given an existing contact', () => {
    it('keeps the collection size and saves once', async () => {
      const parent = parentWithChild()
      repositoryMock.givenFound(parent)
      repositoryMock.whenSaveSuccess()

      await useCase.invoke({
        customerId: parent.id.value,
        contactId: contact.id,
        updates: {}
      })

      expect(parent.contacts).toHaveLength(1)
      repositoryMock.assertCalledTimes('save', 1)
    })
  })
})
