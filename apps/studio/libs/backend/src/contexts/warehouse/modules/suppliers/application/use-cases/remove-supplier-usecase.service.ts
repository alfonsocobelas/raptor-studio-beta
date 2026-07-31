import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { SupplierId } from '../../../../../shared/domain/value-objects/suppliers/supplier-id.vo'
import { SupplierRepository } from '../../domain/supplier-repository'
import { RemoveSupplierInput } from '../dtos/remove-supplier-input.dto'

@Injectable()
export class RemoveSupplierUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async invoke(input: RemoveSupplierInput): Promise<void> {
    const supplierId = SupplierId.create(input.id)
    const supplier = await this.supplierRepository.get(supplierId)

    if (!supplier) {
      throw new EntityNotFoundError('Supplier', input.id)
    }

    await this.supplierRepository.remove(supplierId)
  }
}
