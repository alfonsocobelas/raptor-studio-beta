import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'
import { LicenseId } from '../../../../../shared/domain/value-objects/licenses/license-id.vo'
import { LICENSE_CONSTRAINTS } from '../../domain/license-constants'
import { LicenseError } from '../../domain/license-errors'
import { LicenseRepository } from '../../domain/license-repository'
import { RegisterConsumptionInput } from '../dtos/register-consumption-input.dto'

const PERIOD_MONTH = LICENSE_CONSTRAINTS.PERIOD_MONTH

@Injectable()
export class RegisterConsumptionUseCase {
  constructor(
    private readonly licenseRepository: LicenseRepository,
    private readonly txManager: TransactionManager
  ) {}

  async invoke(input: RegisterConsumptionInput): Promise<void> {
    const licenseId = LicenseId.create(input.licenseId)

    const license = await this.licenseRepository.get(licenseId)

    if (!license) {
      throw new EntityNotFoundError('License', input.licenseId)
    }

    if (input.periodMonth < PERIOD_MONTH.MIN || input.periodMonth > PERIOD_MONTH.MAX) {
      throw new LicenseError(`Consumption period month must be between ${PERIOD_MONTH.MIN} and ${PERIOD_MONTH.MAX}`)
    }

    if (typeof input.units !== 'number' || Number.isNaN(input.units) || input.units < 0) {
      throw new LicenseError('Consumption units must be a number greater than or equal to 0')
    }

    const periodTaken = await this.licenseRepository.consumptionForPeriod(
      licenseId,
      input.periodYear,
      input.periodMonth
    )

    if (periodTaken) {
      throw new AlreadyExistsError('Consumption', 'period', `${input.periodYear}-${input.periodMonth}`)
    }

    // El registro y el snapshot denormalizado (spec 26) deben quedar consistentes o no quedar:
    // misma transacción (patrón del use case transaccional de la referencia).
    await this.txManager.runInTransaction(async () => {
      await this.licenseRepository.addConsumption({
        id: input.id,
        licenseId: input.licenseId,
        periodYear: input.periodYear,
        periodMonth: input.periodMonth,
        units: input.units,
        source: input.source ?? 'MANUAL'
      })
      await this.licenseRepository.recomputeConsumptionSnapshot(licenseId)
    })
  }
}
