import { Injectable } from '@nestjs/common'
import { messageOf } from '../../../../../shared/utils/error-message'
import { SapEndpointDef, SapForMeGateway, SapSession } from '../../../sap-sync/domain/sap-for-me-gateway'
import { PhaseResult, SapSyncPhase, SyncPhaseContext } from '../../../sap-sync/domain/sap-sync-phase'
import { SyncCategory } from '../../../sap-sync/domain/sync-run-types'
import { ContractsPayloadMapper } from '../mappers/contracts-payload.mapper'
import { SyncContractsService } from '../services/sync-contracts.service'

// Pares agregado+detalle de cloud (spec 30) y on-prem (spec 39). Nombres de entidad verificados
// en vivo contra $metadata el 2026-07-12.
const CLOUD_ACTIVE_ENDPOINT: SapEndpointDef = {
  service: 'partner',
  entity: 'CloudActiveSalesContracts',
  extraParams: { $orderby: 'customerName,nbrOfContracts' }
}
const CLOUD_DETAILS_ENDPOINT: SapEndpointDef = {
  service: 'partner',
  entity: 'CloudActiveSalesContractsDetails'
}
const ONPREM_ACTIVE_ENDPOINT: SapEndpointDef = {
  service: 'partner',
  entity: 'OnPremiseActiveSalesContracts',
  extraParams: { $orderby: 'customerName,nbrOfContracts' }
}
const ONPREM_DETAILS_ENDPOINT: SapEndpointDef = {
  service: 'partner',
  entity: 'OnPremiseActiveSalesContractsDetails'
}
// Renovaciones próximas (spec 44): fuente real de renewalType, join por SapID = contractNumber.
const RENEWALS_ENDPOINT: SapEndpointDef = {
  service: 'finance',
  entity: 'UpcomingCloudRenewals'
}
// Fuente real de billingFrequency y currency (spec 45), join por SapID = contractNumber.
// Constante deliberadamente duplicada con la fase de licencias: cada fase es dueña de sus endpoints.
const CONTRACTS_REDESIGN_ENDPOINT: SapEndpointDef = {
  service: 'finance',
  entity: 'ContractsRedesign',
  extraParams: { isPartnerInUrl: 'true' }
}

/**
 * Phase 2 of the SAP sync run: ingests active sales contracts from the cloud and on-prem
 * aggregated+details pairs. The merge resolves contracts present in both feeds as one 'mixed'
 * record. Errors propagate so the orchestrator records the category failure and continues.
 * Deposits the seen contract numbers for the archive step as soon as the merge resolves them
 * (an ingest failure does not lose what the feed brought — harmless, archiving only runs on
 * clean runs; since spec 44 the licenses phase resolves its contracts from the DB, not from ctx).
 */
@Injectable()
export class SyncContractsPhase implements SapSyncPhase {
  readonly category: SyncCategory = 'contracts'

  constructor(
    private readonly gateway: SapForMeGateway,
    private readonly syncContracts: SyncContractsService
  ) {}

  async execute(session: SapSession, ctx: SyncPhaseContext): Promise<PhaseResult> {
    const cloud = ContractsPayloadMapper.toSyncRecords(
      await this.fetch(session, CLOUD_ACTIVE_ENDPOINT),
      await this.fetch(session, CLOUD_DETAILS_ENDPOINT)
    )
    const onprem = ContractsPayloadMapper.toSyncRecords(
      await this.fetch(session, ONPREM_ACTIVE_ENDPOINT),
      await this.fetch(session, ONPREM_DETAILS_ENDPOINT),
      'onprem'
    )
    const merged = ContractsPayloadMapper.merge(cloud, onprem)
    const renewalRows = await this.fetch(session, RENEWALS_ENDPOINT)
    const redesignRows = await this.fetch(session, CONTRACTS_REDESIGN_ENDPOINT)
    const contracts = ContractsPayloadMapper.withBillingAndCurrency(
      ContractsPayloadMapper.withRenewals(merged.contracts, renewalRows),
      redesignRows
    )

    ctx.seenContractKeys.push(...contracts.map(contract => contract.contractNumber))

    const output = await this.syncContracts.sync({ contracts, seenAt: ctx.seenAt })
    return { records: output.records, failures: output.failures.length }
  }

  private async fetch(session: SapSession, endpoint: SapEndpointDef): Promise<Record<string, unknown>[]> {
    try {
      return await this.gateway.fetch(session, endpoint)
    } catch (error) {
      throw new Error(`Fetch of "${endpoint.entity}" failed: ${messageOf(error)}`)
    }
  }
}
