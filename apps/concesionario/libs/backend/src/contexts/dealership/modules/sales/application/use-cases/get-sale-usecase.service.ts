import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { SaleId } from '../../../../../shared/domain/value-objects/sales/sale-id.vo'
import { SaleRepository } from '../../domain/sale-repository'
import { SalePrimitiveProps } from '../../domain/sale-types'
import { GetSaleInput } from '../dtos/get-sale-input.dto'

@Injectable()
export class GetSaleUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async invoke(input: GetSaleInput): Promise<SalePrimitiveProps> {
    const saleId = SaleId.create(input.id)
    const sale = await this.saleRepository.get(saleId)

    if (!sale) {
      throw new EntityNotFoundError('Sale', input.id)
    }

    return sale.toPrimitives()
  }
}
