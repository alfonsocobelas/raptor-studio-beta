import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'
import { LicenseId } from '../../../../shared/domain/value-objects/licenses/license-id.vo'
import { License } from './license'

export abstract class LicenseRepository {
  abstract register(license: License): Promise<void>
  abstract save(license: License): Promise<void>
  abstract removeDraggedByContractId(parentIds: string[], op: DeleteOperationId): Promise<string[]>
  abstract removeDraggedByCustomerId(parentIds: string[], op: DeleteOperationId): Promise<string[]>
  abstract get(licenseId: LicenseId): Promise<Nullable<License>>
  abstract matching(criteria: Criteria): Promise<License[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
