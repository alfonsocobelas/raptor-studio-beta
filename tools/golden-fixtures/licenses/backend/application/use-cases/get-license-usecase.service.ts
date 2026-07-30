import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { LicenseId } from '../../../../../shared/domain/value-objects/licenses/license-id.vo'
import { LicenseRepository } from '../../domain/license-repository'
import { LicensePrimitiveProps } from '../../domain/license-types'
import { GetLicenseInput } from '../dtos/get-license-input.dto'

@Injectable()
export class GetLicenseUseCase {
  constructor(private readonly licenseRepository: LicenseRepository) {}

  async invoke(input: GetLicenseInput): Promise<LicensePrimitiveProps> {
    const licenseId = LicenseId.create(input.id)
    const license = await this.licenseRepository.get(licenseId)

    if (!license) {
      throw new EntityNotFoundError('License', input.id)
    }

    return license.toPrimitives()
  }
}
