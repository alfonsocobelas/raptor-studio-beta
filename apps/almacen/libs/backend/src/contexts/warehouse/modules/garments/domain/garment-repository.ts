import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { GarmentId } from '../../../../shared/domain/value-objects/garments/garment-id.vo'
import { Sku } from './value-objects/sku.vo'
import { Garment } from './garment'

export abstract class GarmentRepository {
  abstract register(garment: Garment): Promise<void>
  abstract save(garment: Garment): Promise<void>
  abstract remove(garmentId: GarmentId): Promise<void>
  abstract get(garmentId: GarmentId): Promise<Nullable<Garment>>
  abstract matching(criteria: Criteria): Promise<Garment[]>
  abstract findBySku(sku: Sku): Promise<Nullable<Garment>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
