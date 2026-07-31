import { v7 as uuidv7 } from 'uuid'
import { GetSaleUseCase } from '../../../../../src/contexts/dealership/modules/sales/application/use-cases/get-sale-usecase.service'
import { EntityNotFoundError } from '../../../../../src/contexts/shared/domain/errors'
import { SaleMother } from '../../domain/mothers/sale.mother'
import { SaleRepositoryMock } from '../../mocks/sale.repository.mock'

describe('GetSaleUseCase', () => {
  let repositoryMock: SaleRepositoryMock
  let useCase: GetSaleUseCase

  beforeEach(() => {
    repositoryMock = new SaleRepositoryMock()
    useCase = new GetSaleUseCase(repositoryMock)
  })

  describe('given the sale exists', () => {
    it('returns its primitives', async () => {
      const sale = SaleMother.random()
      repositoryMock.givenFound(sale)

      const result = await useCase.invoke({ id: sale.id.value })

      expect(result).toEqual(sale.toPrimitives())
    })
  })

  describe('given the sale does not exist', () => {
    it('throws EntityNotFoundError', async () => {
      repositoryMock.givenNotFound()

      await expect(useCase.invoke({ id: uuidv7() })).rejects.toThrow(EntityNotFoundError)
    })
  })
})
