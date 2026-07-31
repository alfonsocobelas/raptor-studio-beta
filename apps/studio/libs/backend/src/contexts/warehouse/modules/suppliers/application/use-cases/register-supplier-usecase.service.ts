import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { Supplier } from '../../domain/supplier'
import { SupplierRepository } from '../../domain/supplier-repository'
import { withTaxId } from '../../domain/specifications/supplier-with-tax-id.specification'
import { RegisterSupplierInput } from '../dtos/register-supplier-input.dto'

@Injectable()
export class RegisterSupplierUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async invoke(input: RegisterSupplierInput): Promise<void> {
    const supplier = Supplier.register(input)
    if (supplier.hasTaxId()) {
      const taxIdExists = await this.supplierRepository.exists(withTaxId(supplier.taxId))

      if (taxIdExists) {
        throw new AlreadyExistsError('Supplier', 'taxId', supplier.taxId.value)
      }
    }

    await this.supplierRepository.register(supplier)
  }
}
