import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { Customer } from '../../domain/customer'
import { CustomerRepository } from '../../domain/customer-repository'
import { CustomerUpdateProps } from '../../domain/customer-types'
import { SapId } from '../../domain/value-objects/sap-id.vo'
import { CustomerName } from '../../../../shared/domain/value-objects/customer-name.vo'
import { AppLogger } from '../../../../../shared/domain/logger/logger'
import { messageOf } from '../../../../../shared/utils/error-message'
import {
  SyncCustomerFailure,
  SyncCustomerIdentity,
  SyncCustomersInput,
  SyncCustomersOutput
} from '../dtos/sync-customers-input.dto'

/**
 * Upserts customer identities extracted from SAP payloads. It only writes the fields
 * SAP owns (sapId, name) plus the sync lifecycle: every processed identity gets its
 * presence marked (markSeenInSync), which also reactivates archived customers that
 * reappear in SAP. Manually-entered fields (taxId, industry, address, phone, notes)
 * are never touched on existing customers.
 */
@Injectable()
export class SyncCustomersService {
  private static readonly CONTEXT = SyncCustomersService.name

  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly logger: AppLogger
  ) {}

  async sync(input: SyncCustomersInput): Promise<SyncCustomersOutput> {
    const seenAt = new Date(input.seenAt)
    const processed = new Set<string>()
    const failures: SyncCustomerFailure[] = []

    for (const rawCustomer of input.customers) {
      if (processed.has(rawCustomer.sapId)) {
        continue
      }
      processed.add(rawCustomer.sapId)

      try {
        await this.upsert(rawCustomer, seenAt)
      } catch (error) {
        const reason = messageOf(error)
        this.logger.warn(`Failed to sync customer ${rawCustomer.sapId}: ${reason}`, SyncCustomersService.CONTEXT)

        failures.push({ sapId: rawCustomer.sapId, reason })
      }
    }

    return { records: processed.size - failures.length, failures }
  }

  private async upsert(rawCustomer: SyncCustomerIdentity, seenAt: Date): Promise<void> {
    const customer = await this.customerRepository.findBySapId(SapId.create(rawCustomer.sapId))
    const name = CustomerName.normalizeName(rawCustomer.name)

    if (!customer) {
      const newCustomer = Customer.register({ id: uuidv7(), ...rawCustomer, name })
      newCustomer.markSeenInSync(seenAt)

      await this.customerRepository.register(newCustomer)
      return
    }

    const updates: CustomerUpdateProps = { name, customerType: rawCustomer.customerType }
    if (rawCustomer.city !== undefined) {
      updates.city = rawCustomer.city
    }
    if (rawCustomer.country !== undefined) {
      updates.country = rawCustomer.country
    }
    customer.updateDetails(updates)
    customer.markSeenInSync(seenAt)
    await this.customerRepository.save(customer)
  }
}
