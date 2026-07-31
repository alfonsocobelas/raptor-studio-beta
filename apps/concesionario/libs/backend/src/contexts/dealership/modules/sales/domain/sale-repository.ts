import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { SaleId } from '../../../../shared/domain/value-objects/sales/sale-id.vo'
import { SaleReference } from './value-objects/sale-reference.vo'
import { Sale } from './sale'

export abstract class SaleRepository {
  abstract register(sale: Sale): Promise<void>
  abstract save(sale: Sale): Promise<void>
  abstract remove(saleId: SaleId): Promise<void>
  abstract get(saleId: SaleId): Promise<Nullable<Sale>>
  abstract matching(criteria: Criteria): Promise<Sale[]>
  abstract findByReference(reference: SaleReference): Promise<Nullable<Sale>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
