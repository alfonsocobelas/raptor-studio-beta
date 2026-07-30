import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { LicenseId } from '../../../../shared/domain/value-objects/licenses/license-id.vo'
import { License } from './license'

export abstract class LicenseRepository {
  abstract register(license: License): Promise<void>
  abstract save(license: License): Promise<void>
  abstract get(licenseId: LicenseId): Promise<Nullable<License>>
  abstract matching(criteria: Criteria): Promise<License[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
}
