import { v7 as uuidv7 } from 'uuid'
import { RemoveSaleUseCase } from '../../../../../src/contexts/dealership/modules/sales/application/use-cases/remove-sale-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { SaleMother } from '../../domain/mothers/sale.mother'
import { SaleRepositoryMock } from '../../mocks/sale.repository.mock'

describe('RemoveSaleUseCase', () => {
  let repositoryMock: SaleRepositoryMock
  let useCase: RemoveSaleUseCase

  beforeEach(() => {
    repositoryMock = new SaleRepositoryMock()
    useCase = new RemoveSaleUseCase(repositoryMock)
  })

  describe('given the sale exists', () => {
    it('removes it', async () => {
      const sale = SaleMother.random()
      repositoryMock.givenFound(sale)
      repositoryMock.whenRemoveSuccess()

      await useCase.invoke({ id: sale.id.value })

      repositoryMock.assertCalled('remove')
    })
  })

  describe('given the sale does not exist', () => {
    it('throws EntityNotFoundError and does not remove', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
      repositoryMock.assertNotCalled('remove')
    })
  })
})
