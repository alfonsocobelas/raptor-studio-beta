import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { TransactionManager } from '../../../../../shared/domain/persistence/transaction-manager'
import { CustomerRepository } from '../../../customers/domain/customer-repository'
import { SapId } from '../../../customers/domain/value-objects/sap-id.vo'
import { CustomerId } from '../../../../../shared/domain/value-objects/customers/customer-id.vo'
import { License } from '../../domain/license'
import { LicenseRepository } from '../../domain/license-repository'
import { withCustomerAndMetric } from '../../domain/specifications/license-with-customer-and-metric.specification'
import { MetricId } from '../../domain/value-objects/metric-id.vo'
import { Nullable } from '../../../../../shared/domain/types'
import { AppLogger } from '../../../../../shared/domain/logger/logger'
import { messageOf } from '../../../../../shared/utils/error-message'
import {
  SyncConsumptionFailure,
  SyncConsumptionRecord,
  SyncLicensesInput,
  SyncLicensesOutput
} from '../dtos/sync-licenses-input.dto'

/**
 * Records SAP consumption onto existing licenses, matched EXACTLY by (customer, metricId):
 * the (customer, subSolutionArea) fallback died with spec 48 — it imputed incomparable units
 * onto ME_SAP licenses (the 1000000% case). Licenses are manually-managed master data (they
 * require a contract and a price SAP does not provide), so this service never creates or
 * modifies licenses: it only upserts the period's consumption record with source ME_SAP and
 * keeps the denormalized snapshot in sync. Records without customer, metricId or matching
 * license are skipped, and so are records whose (customer, metric) matches more than one
 * license: attribution must be deterministic.
 */
@Injectable()
export class SyncLicensesService {
  private static readonly CONTEXT = SyncLicensesService.name

  constructor(
    private readonly licenseRepository: LicenseRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly txManager: TransactionManager,
    private readonly logger: AppLogger
  ) {}

  async sync(input: SyncLicensesInput): Promise<SyncLicensesOutput> {
    let processed = 0
    let skipped = 0
    const failures: SyncConsumptionFailure[] = []

    for (const record of input.consumption) {
      try {
        const written = await this.syncRecord(record)
        if (written) {
          processed += 1
        } else {
          skipped += 1
        }
      } catch (error) {
        const reason = messageOf(error)
        this.logger.warn(
          `Failed to sync consumption for customer ${record.customerSapId} ` +
            `(metric '${record.metricId}', ${record.periodYear}-${record.periodMonth}): ${reason}`,
          SyncLicensesService.CONTEXT
        )
        failures.push({
          customerSapId: record.customerSapId,
          metricId: record.metricId,
          periodYear: record.periodYear,
          periodMonth: record.periodMonth,
          reason
        })
      }
    }

    return { records: processed, skipped, failures }
  }

  private async syncRecord(record: SyncConsumptionRecord): Promise<boolean> {
    if (!record.metricId) {
      return false
    }

    const customer = await this.customerRepository.findBySapId(SapId.create(record.customerSapId))
    if (!customer) {
      return false
    }

    const license = await this.findLicense(customer.id, record)
    if (!license) {
      return false
    }

    const existing = await this.licenseRepository.consumptionForPeriod(
      license.id,
      record.periodYear,
      record.periodMonth
    )

    // Cada escritura de consumo mantiene el snapshot denormalizado en la misma transacción (spec 26).
    if (!existing) {
      await this.txManager.runInTransaction(async () => {
        await this.licenseRepository.addConsumption({
          id: uuidv7(),
          licenseId: license.id.value,
          periodYear: record.periodYear,
          periodMonth: record.periodMonth,
          units: record.units,
          source: 'ME_SAP'
        })
        await this.licenseRepository.recomputeConsumptionSnapshot(license.id)
      })
    } else if (existing.units !== record.units) {
      await this.txManager.runInTransaction(async () => {
        await this.licenseRepository.updateConsumption({ ...existing, units: record.units, source: 'ME_SAP' })
        await this.licenseRepository.recomputeConsumptionSnapshot(license.id)
      })
    }

    return true
  }

  // Matching EXACTO por (customer, metricId); >1 candidata o 0 → null (skipped): la
  // imputación debe ser determinista.
  private async findLicense(customerId: CustomerId, record: SyncConsumptionRecord): Promise<Nullable<License>> {
    const byMetric = await this.licenseRepository.matching(
      withCustomerAndMetric(customerId, MetricId.create(record.metricId))
    )
    return byMetric.length === 1 ? byMetric[0] : null
  }
}
