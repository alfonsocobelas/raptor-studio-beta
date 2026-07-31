import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { SupplierRepository } from '../../domain/supplier-repository'
import { withTaxId } from '../../domain/specifications/supplier-with-tax-id.specification'
import { SupplierId } from '../../../../../shared/domain/value-objects/suppliers/supplier-id.vo'
import { UpdateSupplierInput } from '../dtos/update-supplier-input.dto'

@Injectable()
export class UpdateSupplierUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async invoke(input: UpdateSupplierInput): Promise<void> {
    const supplierId = SupplierId.create(input.id)
    const supplier = await this.supplierRepository.get(supplierId)

    if (!supplier) {
      throw new EntityNotFoundError('Supplier', input.id)
    }

    const newTaxId = supplier.newTaxIdIfChanged(input.updates)

    if (newTaxId) {
      const taxIdExists = await this.supplierRepository.exists(withTaxId(newTaxId))

      if (taxIdExists) {
        throw new AlreadyExistsError('Supplier', 'taxId', newTaxId.value)
      }
    }

    supplier.updateDetails(input.updates)
    await this.supplierRepository.save(supplier)
  }
}
