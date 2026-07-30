import { Injectable } from '@nestjs/common'
import { messageOf } from '../../../../../shared/utils/error-message'
import { ContractRepository } from '../../../contracts/domain/contract-repository'
import { inForceContracts } from '../../../contracts/domain/specifications/in-force-contracts.specification'
import { SapEndpointDef, SapForMeGateway, SapSession } from '../../../sap-sync/domain/sap-for-me-gateway'
import { PhaseResult, SapSyncPhase, SyncPhaseContext } from '../../../sap-sync/domain/sap-sync-phase'
import { SyncCategory } from '../../../sap-sync/domain/sync-run-types'
import { MaterialsPayloadMapper } from '../mappers/materials-payload.mapper'
import { SyncLicensesFromMaterialsService } from '../services/sync-licenses-from-materials.service'

// Contratos de cliente en finance (spec 33): lista las filas por contrato; los materiales se piden
// por FILA con params nombrados (un contrato tiene varias filas/órdenes, cada una devuelve su
// subconjunto y el endpoint rechaza paginación).
const CONTRACTS_REDESIGN_ENDPOINT: SapEndpointDef = {
  service: 'finance',
  entity: 'ContractsRedesign',
  extraParams: { isPartnerInUrl: 'true' }
}

/**
 * Phase 4 of the SAP sync run: ingests licenses from SAP contract materials (spec 33). It lists
 * ContractsRedesign, keeps the CURRENT rows of contracts in force IN THE DATABASE (spec 44: the
 * repo is the source — the phase no longer depends on the contracts phase having succeeded this
 * run) and fetches the materials per row. Without that filter we would fire N calls for contracts
 * the service would skip anyway. Deposits the seen material keys for ArchivePhase.
 */
@Injectable()
export class SyncLicensesPhase implements SapSyncPhase {
  readonly category: SyncCategory = 'licenses'

  constructor(
    private readonly gateway: SapForMeGateway,
    private readonly contractRepository: ContractRepository,
    private readonly syncLicensesFromMaterials: SyncLicensesFromMaterialsService
  ) {}

  async execute(session: SapSession, ctx: SyncPhaseContext): Promise<PhaseResult> {
    const contracts = await this.contractRepository.matching(inForceContracts())
    const activeContractNumbers = new Set(
      contracts.map(contract => contract.contractNumber?.value).filter((value): value is string => Boolean(value))
    )

    const contractRows = await this.fetch(session, CONTRACTS_REDESIGN_ENDPOINT)
    const rows = contractRows.filter(
      row => String(row.DatePeriod ?? '') === 'CURRENT' && activeContractNumbers.has(String(row.SapID ?? ''))
    )

    const rawMaterials: Record<string, unknown>[] = []
    for (const row of rows) {
      rawMaterials.push(...(await this.gateway.fetch(session, this.materialsEndpoint(row))))
    }
    const materials = MaterialsPayloadMapper.toSyncRecords(rawMaterials).materials

    ctx.seenMaterialKeys.push(...materials.map(material => `${material.contractNumber}#${material.materialId}`))

    const output = await this.syncLicensesFromMaterials.sync({ materials, seenAt: ctx.seenAt })
    return { records: output.records, failures: output.failures.length }
  }

  private materialsEndpoint(contractRow: Record<string, unknown>): SapEndpointDef {
    return {
      service: 'finance',
      entity: 'ContractCurrentMaterialsRedesign',
      paginated: false,
      extraParams: {
        sapID: String(contractRow.SapID ?? ''),
        isPartnerInUrl: 'true',
        cmsCaseID: String(contractRow.CMSCaseID ?? ''),
        contractEndDate: String(contractRow.ContractEnd ?? ''),
        isCCFlex: 'false'
      }
    }
  }

  private async fetch(session: SapSession, endpoint: SapEndpointDef): Promise<Record<string, unknown>[]> {
    try {
      return await this.gateway.fetch(session, endpoint)
    } catch (error) {
      throw new Error(`Fetch of "${endpoint.entity}" failed: ${messageOf(error)}`)
    }
  }
}
