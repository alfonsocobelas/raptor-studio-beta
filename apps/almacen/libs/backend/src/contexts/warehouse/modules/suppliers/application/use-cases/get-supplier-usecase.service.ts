import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { SupplierId } from '../../../../../shared/domain/value-objects/suppliers/supplier-id.vo'
import { SupplierRepository } from '../../domain/supplier-repository'
import { SupplierPrimitiveProps } from '../../domain/supplier-types'
import { GetSupplierInput } from '../dtos/get-supplier-input.dto'

@Injectable()
export class GetSupplierUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async invoke(input: GetSupplierInput): Promise<SupplierPrimitiveProps> {
    const supplierId = SupplierId.create(input.id)
    const supplier = await this.supplierRepository.get(supplierId)

    if (!supplier) {
      throw new EntityNotFoundError('Supplier', input.id)
    }

    return supplier.toPrimitives()
  }
}
