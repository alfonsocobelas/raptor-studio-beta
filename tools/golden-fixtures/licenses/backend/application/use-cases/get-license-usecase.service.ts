import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { LicenseId } from '../../../../../shared/domain/value-objects/licenses/license-id.vo'
import { LicenseRepository } from '../../domain/license-repository'
import { ConsumptionRecord, LicenseWithConsumption } from '../../domain/license-types'
import { GetLicenseInput } from '../dtos/get-license-input.dto'
import { enrichLicense } from '../factories/license-enrichment'

export interface LicenseDetailOutput extends LicenseWithConsumption {
  consumption: ConsumptionRecord[]
}

@Injectable()
export class GetLicenseUseCase {
  constructor(private readonly licenseRepository: LicenseRepository) {}

  async invoke(input: GetLicenseInput): Promise<LicenseDetailOutput> {
    const licenseId = LicenseId.create(input.id)
    const license = await this.licenseRepository.getWithConsumption(licenseId)

    if (!license) {
      throw new EntityNotFoundError('License', input.id)
    }

    const currentUnits = GetLicenseUseCase.latestUnits(license.consumption)
    const enriched = enrichLicense(license.license.toPrimitives(), currentUnits)

    return { ...enriched, consumption: license.consumption }
  }

  private static latestUnits(consumption: ConsumptionRecord[]): number {
    let latest: ConsumptionRecord | null = null
    for (const record of consumption) {
      const isNewer =
        !latest ||
        record.periodYear > latest.periodYear ||
        (record.periodYear === latest.periodYear && record.periodMonth > latest.periodMonth)
      if (isNewer) {
        latest = record
      }
    }
    return latest?.units ?? 0
  }
}
