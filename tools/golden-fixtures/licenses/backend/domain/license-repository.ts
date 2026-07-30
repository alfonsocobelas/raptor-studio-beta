import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { LicenseId } from '../../../../shared/domain/value-objects/licenses/license-id.vo'
import { License } from './license'
import { ConsumptionRecord } from './license-types'

export interface LicenseWithConsumptionHistory {
  license: License
  consumption: ConsumptionRecord[]
}

export abstract class LicenseRepository {
  abstract register(license: License): Promise<void>
  abstract save(license: License): Promise<void>
  abstract get(licenseId: LicenseId): Promise<Nullable<License>>
  abstract getWithConsumption(licenseId: LicenseId): Promise<Nullable<LicenseWithConsumptionHistory>>
  abstract matching(criteria: Criteria): Promise<License[]>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
  abstract addConsumption(record: ConsumptionRecord): Promise<void>
  abstract updateConsumption(record: ConsumptionRecord): Promise<void>
  // Recalcula el snapshot denormalizado desde el registro de consumo más reciente. Debe invocarse,
  // dentro de la misma transacción, tras CUALQUIER escritura de consumos (spec 26).
  abstract recomputeConsumptionSnapshot(licenseId: LicenseId): Promise<void>
  abstract consumptionByLicense(licenseId: LicenseId): Promise<ConsumptionRecord[]>
  // Registro de un periodo concreto (consulta puntual sobre el índice único licencia+periodo),
  // para comprobar duplicados/correcciones sin cargar el histórico completo.
  abstract consumptionForPeriod(
    licenseId: LicenseId,
    periodYear: number,
    periodMonth: number
  ): Promise<Nullable<ConsumptionRecord>>
}
