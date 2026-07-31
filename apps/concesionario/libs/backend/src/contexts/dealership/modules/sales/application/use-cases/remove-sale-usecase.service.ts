import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { SaleId } from '../../../../../shared/domain/value-objects/sales/sale-id.vo'
import { SaleRepository } from '../../domain/sale-repository'
import { RemoveSaleInput } from '../dtos/remove-sale-input.dto'

@Injectable()
export class RemoveSaleUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async invoke(input: RemoveSaleInput): Promise<void> {
    const saleId = SaleId.create(input.id)
    const sale = await this.saleRepository.get(saleId)

    if (!sale) {
      throw new EntityNotFoundError('Sale', input.id)
    }

    await this.saleRepository.remove(saleId)
  }
}
