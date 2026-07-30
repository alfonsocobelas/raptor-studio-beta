import { Injectable } from '@nestjs/common'
import { messageOf } from '../../../../../shared/utils/error-message'
import { SapEndpointDef, SapForMeGateway, SapSession } from '../../../sap-sync/domain/sap-for-me-gateway'
import { PhaseResult, SapSyncPhase, SyncPhaseContext } from '../../../sap-sync/domain/sap-sync-phase'
import { SyncCategory } from '../../../sap-sync/domain/sync-run-types'
import { MaintenancePayloadMapper } from '../mappers/maintenance-payload.mapper'
import { SyncMaintenanceService } from '../services/sync-maintenance.service'

// Mantenimientos on-prem (spec 44): una fila por posición (PosNr) de contrato de mantenimiento.
const MAINTENANCES_ENDPOINT: SapEndpointDef = {
  service: 'finance',
  entity: 'ISMaintenances'
}

/**
 * Phase 3 of the SAP sync run: ingests maintenance contracts from ISMaintenances, aggregated by
 * SAP contract id (cmsCaseId, the upsert key — 36% of the feed has no ContractID). Errors
 * propagate so the orchestrator records the category failure and continues. Deposits the seen
 * cmsCaseIds for ArchivePhase (same seenContractKeys pool as the contracts phase: keys never
 * collide, contract numbers and case ids live in different SAP ranges).
 */
@Injectable()
export class SyncMaintenancePhase implements SapSyncPhase {
  readonly category: SyncCategory = 'maintenance'

  constructor(
    private readonly gateway: SapForMeGateway,
    private readonly syncMaintenance: SyncMaintenanceService
  ) {}

  async execute(session: SapSession, ctx: SyncPhaseContext): Promise<PhaseResult> {
    const rows = await this.fetchMaintenances(session)
    const mapped = MaintenancePayloadMapper.toSyncRecords(rows)

    ctx.seenContractKeys.push(...mapped.maintenances.map(maintenance => maintenance.cmsCaseId))

    const output = await this.syncMaintenance.sync({ maintenances: mapped.maintenances, seenAt: ctx.seenAt })
    return { records: output.records, failures: output.failures.length + mapped.skippedInvalid }
  }

  private async fetchMaintenances(session: SapSession): Promise<Record<string, unknown>[]> {
    try {
      return await this.gateway.fetch(session, MAINTENANCES_ENDPOINT)
    } catch (error) {
      throw new Error(`Fetch of "${MAINTENANCES_ENDPOINT.entity}" failed: ${messageOf(error)}`)
    }
  }
}
