import { LicenseId } from '../../../../../shared/domain/value-objects/licenses/license-id.vo'
import { RegisterLicenseInput } from '../../application/dtos/register-license-input.dto'
import { RegisterLicenseUseCase } from '../../application/use-cases/register-license-usecase.service'
import { LicenseRepository } from '../../domain/license-repository'
import { ConsumptionRecord } from '../../domain/license-types'

export interface LicenseSeedSummary {
  licensesCreated: number
  licensesSkipped: number
  consumptionCreated: number
  consumptionSkipped: number
}

// Siembra idempotente de licencias y consumo. Las licencias no tienen clave de negocio
// única, así que la idempotencia se basa en el id (fixtures deterministas). El consumo se
// salta si ya existe el periodo (year/month) para la licencia.
export class LicenseLocalSeeder {
  constructor(
    private readonly registerLicense: RegisterLicenseUseCase,
    private readonly licenseRepository: LicenseRepository
  ) {}

  async seed(licenses: RegisterLicenseInput[], consumption: ConsumptionRecord[]): Promise<LicenseSeedSummary> {
    const summary: LicenseSeedSummary = {
      licensesCreated: 0,
      licensesSkipped: 0,
      consumptionCreated: 0,
      consumptionSkipped: 0
    }

    for (const license of licenses) {
      const existing = await this.licenseRepository.get(LicenseId.create(license.id))
      if (existing) {
        summary.licensesSkipped++
        continue
      }
      await this.registerLicense.invoke(license)
      summary.licensesCreated++
    }

    for (const record of consumption) {
      const existing = await this.licenseRepository.consumptionByLicense(LicenseId.create(record.licenseId))
      const alreadyHasPeriod = existing.some(
        r => r.periodYear === record.periodYear && r.periodMonth === record.periodMonth
      )
      if (alreadyHasPeriod) {
        summary.consumptionSkipped++
        continue
      }
      await this.licenseRepository.addConsumption(record)
      summary.consumptionCreated++
    }

    return summary
  }
}
