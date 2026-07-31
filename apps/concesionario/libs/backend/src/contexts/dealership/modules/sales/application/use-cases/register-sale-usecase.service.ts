import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { Sale } from '../../domain/sale'
import { SaleRepository } from '../../domain/sale-repository'
import { withReference } from '../../domain/specifications/sale-with-reference.specification'
import { RegisterSaleInput } from '../dtos/register-sale-input.dto'

@Injectable()
export class RegisterSaleUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async invoke(input: RegisterSaleInput): Promise<void> {
    const sale = Sale.register(input)
    const referenceExists = await this.saleRepository.exists(withReference(sale.reference))

    if (referenceExists) {
      throw new AlreadyExistsError('Sale', 'reference', sale.reference.value)
    }

    await this.saleRepository.register(sale)
  }
}
