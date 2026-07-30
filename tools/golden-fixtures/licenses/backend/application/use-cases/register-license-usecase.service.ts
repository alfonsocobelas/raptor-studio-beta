import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { License } from '../../domain/license'
import { LicenseRepository } from '../../domain/license-repository'
import { withContractAndManualMetricName } from '../../domain/specifications/license-with-contract-and-manual-metric-name.specification'
import { RegisterLicenseInput } from '../dtos/register-license-input.dto'

@Injectable()
export class RegisterLicenseUseCase {
  constructor(private readonly licenseRepository: LicenseRepository) {}

  async invoke(input: RegisterLicenseInput): Promise<void> {
    const license = License.register(input)

    const exists = await this.licenseRepository.exists(
      withContractAndManualMetricName(license.contractId.value, license.metricName.value)
    )

    if (exists) {
      throw new AlreadyExistsError('License', 'metricName', license.metricName.value)
    }

    await this.licenseRepository.register(license)
  }
}
