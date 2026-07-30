import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { SaleRepository } from '../../domain/sale-repository'
import { withReference } from '../../domain/specifications/sale-with-reference.specification'
import { SaleId } from '../../../../../shared/domain/value-objects/sales/sale-id.vo'
import { UpdateSaleInput } from '../dtos/update-sale-input.dto'

@Injectable()
export class UpdateSaleUseCase {
  constructor(private readonly saleRepository: SaleRepository) {}

  async invoke(input: UpdateSaleInput): Promise<void> {
    const saleId = SaleId.create(input.id)
    const sale = await this.saleRepository.get(saleId)

    if (!sale) {
      throw new EntityNotFoundError('Sale', input.id)
    }

    const newReference = sale.newReferenceIfChanged(input.updates)

    if (newReference) {
      const referenceExists = await this.saleRepository.exists(withReference(newReference))

      if (referenceExists) {
        throw new AlreadyExistsError('Sale', 'reference', newReference.value)
      }
    }

    sale.updateDetails(input.updates)
    await this.saleRepository.save(sale)
  }
}
