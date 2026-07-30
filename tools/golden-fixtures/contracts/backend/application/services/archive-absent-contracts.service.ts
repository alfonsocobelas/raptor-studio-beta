import { Injectable } from '@nestjs/common'
import { ContractRepository } from '../../domain/contract-repository'
import { activeMeSapContracts } from '../../domain/specifications/active-me-sap-contracts.specification'
import { ArchiveAbsentContractsInput, ArchiveAbsentContractsOutput } from '../dtos/archive-absent-contracts-input.dto'

/**
 * Archiva los contratos ME_SAP activos cuya clave no ha aparecido en el run actual: contractNumber
 * para cloud/onprem/mixed y cmsCaseId para maintenance (36% del feed no trae número — misma
 * identidad que su upsert). Lo invoca ArchivePhase solo tras un run 100% exitoso: un fallo de
 * fetch no puede decidir qué contratos existen. Los MANUAL nunca son candidatos (la spec filtra
 * ME_SAP) y los nunca-vistos se descartan en memoria (Criteria no expresa IS NOT NULL).
 */
@Injectable()
export class ArchiveAbsentContractsService {
  constructor(private readonly contractRepository: ContractRepository) {}

  async archive(input: ArchiveAbsentContractsInput): Promise<ArchiveAbsentContractsOutput> {
    const seen = new Set(input.seenKeys)
    const archivedAt = new Date(input.archivedAt)
    const candidates = await this.contractRepository.matching(activeMeSapContracts())

    let archived = 0
    for (const contract of candidates) {
      const primitives = contract.toPrimitives()
      if (primitives.lastSeenInSyncAt === null) {
        continue
      }
      const key = primitives.contractType === 'maintenance' ? primitives.cmsCaseId : primitives.contractNumber
      if (!key || seen.has(key)) {
        continue
      }
      contract.archive(archivedAt)
      await this.contractRepository.save(contract)
      archived += 1
    }

    return { archived }
  }
}
