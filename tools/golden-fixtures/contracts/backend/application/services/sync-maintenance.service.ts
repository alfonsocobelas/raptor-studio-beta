import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { CustomerRepository } from '../../../customers/domain/customer-repository'
import { SapId } from '../../../customers/domain/value-objects/sap-id.vo'
import { AppLogger } from '../../../../../shared/domain/logger/logger'
import { messageOf } from '../../../../../shared/utils/error-message'
import { Contract } from '../../domain/contract'
import { ContractRepository } from '../../domain/contract-repository'
import { CmsCaseId } from '../../domain/value-objects/cms-case-id.vo'
import {
  SyncMaintenanceFailure,
  SyncMaintenanceInput,
  SyncMaintenanceOutput,
  SyncMaintenanceRecord
} from '../dtos/sync-maintenance-input.dto'

/**
 * Upserts maintenance contracts extracted from ISMaintenances, keyed by cmsCaseId (36% of the
 * feed carries no ContractID, so the case+order id is the identity). Every field it writes is
 * sync-owned — including totalValue (Σ Fee) and the maintenance fields, which manual edition
 * never touches — and each matched contract is claimed (origin ME_SAP + seen mark). Records
 * whose customer is not registered yet are skipped (customers are always synced first).
 */
@Injectable()
export class SyncMaintenanceService {
  private static readonly CONTEXT = SyncMaintenanceService.name

  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly logger: AppLogger
  ) {}

  async sync(input: SyncMaintenanceInput): Promise<SyncMaintenanceOutput> {
    let processed = 0
    let skipped = 0
    const failures: SyncMaintenanceFailure[] = []
    const seenAt = new Date(input.seenAt)

    for (const rawRecord of input.maintenances) {
      try {
        const sapId = SapId.create(rawRecord.customerSapId)
        const customer = await this.customerRepository.findBySapId(sapId)

        if (!customer) {
          skipped += 1
          continue
        }

        const cmsCaseId = CmsCaseId.create(rawRecord.cmsCaseId)
        const contract = await this.contractRepository.findMaintenanceByCaseId(cmsCaseId)

        if (!contract) {
          const newContract = Contract.register({
            ...rawRecord,
            id: uuidv7(),
            contractType: 'maintenance',
            customerId: customer.id.value,
            customerName: customer.name.value,
            startDate: null
          })
          newContract.claimBySync(seenAt)
          await this.contractRepository.register(newContract)
        } else {
          this.applySyncedFields(contract, rawRecord, customer.name.value)
          contract.claimBySync(seenAt)
          await this.contractRepository.save(contract)
        }

        processed += 1
      } catch (error) {
        const reason = messageOf(error)
        this.logger.warn(
          `Failed to sync maintenance contract (case ${rawRecord.cmsCaseId}): ${reason}`,
          SyncMaintenanceService.CONTEXT
        )
        failures.push({ cmsCaseId: rawRecord.cmsCaseId, reason })
      }
    }

    return { records: processed, skipped, failures }
  }

  private applySyncedFields(contract: Contract, rawRecord: SyncMaintenanceRecord, customerName: string): void {
    contract.updateDetails({
      contractNumber: rawRecord.contractNumber,
      endDate: rawRecord.endDate,
      totalValue: rawRecord.totalValue,
      currency: rawRecord.currency,
      ...(rawRecord.renewalType !== undefined ? { renewalType: rawRecord.renewalType } : {}),
      customerName
    })
    contract.updateMaintenanceFields({
      supportModel: rawRecord.supportModel,
      upcomingMaintenanceEnd: rawRecord.upcomingMaintenanceEnd,
      upcomingMaintenanceFee: rawRecord.upcomingMaintenanceFee
    })
  }
}
