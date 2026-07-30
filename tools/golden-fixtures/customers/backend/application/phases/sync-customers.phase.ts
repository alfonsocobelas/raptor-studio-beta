import { Injectable } from '@nestjs/common'
import { messageOf } from '../../../../../shared/utils/error-message'
import { SapEndpointDef, SapForMeGateway, SapSession } from '../../../sap-sync/domain/sap-for-me-gateway'
import { PhaseResult, SapSyncPhase, SyncPhaseContext } from '../../../sap-sync/domain/sap-sync-phase'
import { SyncCategory } from '../../../sap-sync/domain/sync-run-types'
import { CustomersPayloadMapper } from '../mappers/customers-payload.mapper'
import { SyncCustomersService } from '../services/sync-customers.service'

// Feed canónico de clientes (spec 43): fuente única de identidad + city/country/customerType.
const CUSTOMERS_ENDPOINT: SapEndpointDef = {
  service: 'partner',
  entity: 'CustomerDetailsHeaderNavigationGev',
  paginated: false
}

/**
 * Phase 1 of the SAP sync run: ingests customers from their canonical endpoint. It runs FIRST
 * because every other category references customers by sapId; any error thrown here aborts the
 * whole run via abortsRunOnFailure (per-customer ingest failures are accumulated by
 * SyncCustomersService, not thrown). Deposits the seen sapIds for ArchivePhase.
 */
@Injectable()
export class SyncCustomersPhase implements SapSyncPhase {
  readonly category: SyncCategory = 'customers'
  readonly abortsRunOnFailure = true

  constructor(
    private readonly gateway: SapForMeGateway,
    private readonly syncCustomers: SyncCustomersService
  ) {}

  async execute(session: SapSession, ctx: SyncPhaseContext): Promise<PhaseResult> {
    const rows = await this.fetchCustomers(session)
    const mapped = CustomersPayloadMapper.toSyncRecords(rows)
    const output = await this.syncCustomers.sync({ customers: mapped.customers, seenAt: ctx.seenAt })
    ctx.seenCustomerSapIds.push(...mapped.customers.map(customer => customer.sapId))
    return { records: output.records, failures: output.failures.length + mapped.failures.length }
  }

  private async fetchCustomers(session: SapSession): Promise<Record<string, unknown>[]> {
    try {
      return await this.gateway.fetch(session, CUSTOMERS_ENDPOINT)
    } catch (error) {
      throw new Error(`Fetch of "${CUSTOMERS_ENDPOINT.entity}" failed: ${messageOf(error)}`)
    }
  }
}
