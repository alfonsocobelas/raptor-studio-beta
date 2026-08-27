import { Nullable } from '../../../../shared/domain/types'
import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../shared/domain/query/aggregate'
import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'
import { Criteria } from '../../../../shared/domain/query/criteria'
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
  /** Una agregación del conjunto filtrado (spec 71). `null` = no hay dato, que no es lo mismo que 0. */
  abstract aggregate(criteria: Criteria, op: AggregateOp, field: string): Promise<number | null>
  /** El desglose de una agregación, en una sola consulta (spec 72). */
  abstract aggregateGrouped(criteria: Criteria, spec: GroupedSpec): Promise<AggregateGroup[]>
  // @ai:begin port-extra — finders no derivables (sync, agregaciones)
  // @ai:end
}
