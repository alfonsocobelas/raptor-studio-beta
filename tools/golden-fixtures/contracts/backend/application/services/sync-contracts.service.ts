import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { CustomerRepository } from '../../../customers/domain/customer-repository'
import { SapId } from '../../../customers/domain/value-objects/sap-id.vo'
import { ContractNumber } from '../../../../shared/domain/value-objects/contract-number.vo'
import { Contract } from '../../domain/contract'
import { ContractRepository } from '../../domain/contract-repository'
import { AppLogger } from '../../../../../shared/domain/logger/logger'
import { messageOf } from '../../../../../shared/utils/error-message'
import { SyncContractFailure, SyncContractsInput, SyncContractsOutput } from '../dtos/sync-contracts-input.dto'

/**
 * Upserts contracts extracted from SAP, keyed by contract number (SAP contractId).
 * It only writes the fields SAP owns; manually-entered fields (source, totalValue,
 * notes) are never touched on existing contracts and get domain defaults on creation.
 * renewalType (spec 44, renewals feed), billingFrequency and currency (spec 45,
 * ContractsRedesign) are conditionally sync-governed: written when their feed provides
 * a value, kept as-is when absent. Every matched contract is claimed for the sync
 * (origin ME_SAP + seen mark). Records whose customer is not registered yet are
 * skipped (customers are always synced first).
 */
@Injectable()
export class SyncContractsService {
  private static readonly CONTEXT = SyncContractsService.name

  constructor(
    private readonly contractRepository: ContractRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly logger: AppLogger
  ) {}

  async sync(input: SyncContractsInput): Promise<SyncContractsOutput> {
    let processed = 0
    let skipped = 0
    const failures: SyncContractFailure[] = []
    const seenAt = new Date(input.seenAt)

    for (const rawContract of input.contracts) {
      try {
        const sapId = SapId.create(rawContract.customerSapId)
        const customer = await this.customerRepository.findBySapId(sapId)

        if (!customer) {
          skipped += 1
          continue
        }

        const contractNumber = ContractNumber.create(rawContract.contractNumber)
        const contract = await this.contractRepository.findByContractNumber(contractNumber)

        // El nombre del feed llega crudo de SAP; se persiste el del Customer canónico (spec 47).
        const customerName = customer.name.value

        if (!contract) {
          const newContract = Contract.register({
            ...rawContract,
            customerName,
            id: uuidv7(),
            customerId: customer.id.value
          })
          newContract.claimBySync(seenAt)
          await this.contractRepository.register(newContract)
        } else {
          contract.updateDetails({ ...rawContract, customerName })
          contract.claimBySync(seenAt)
          await this.contractRepository.save(contract)
        }

        processed += 1
      } catch (error) {
        const reason = messageOf(error)
        this.logger.warn(
          `Failed to sync contract ${rawContract.contractNumber}: ${reason}`,
          SyncContractsService.CONTEXT
        )
        failures.push({ contractNumber: rawContract.contractNumber, reason })
      }
    }

    return { records: processed, skipped, failures }
  }
}
