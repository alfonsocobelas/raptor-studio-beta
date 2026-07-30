import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { SupplierId } from '../../../../shared/domain/value-objects/suppliers/supplier-id.vo'
import { SupplierTaxId } from './value-objects/supplier-tax-id.vo'
import { Supplier } from './supplier'

export abstract class SupplierRepository {
  abstract register(supplier: Supplier): Promise<void>
  abstract save(supplier: Supplier): Promise<void>
  abstract remove(supplierId: SupplierId): Promise<void>
  abstract get(supplierId: SupplierId): Promise<Nullable<Supplier>>
  abstract matching(criteria: Criteria): Promise<Supplier[]>
  abstract findByTaxId(taxId: SupplierTaxId): Promise<Nullable<Supplier>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
