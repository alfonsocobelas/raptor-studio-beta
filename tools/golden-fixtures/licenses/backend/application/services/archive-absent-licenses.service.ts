import { Injectable } from '@nestjs/common'
import { LicenseRepository } from '../../domain/license-repository'
import { activeMeSapLicenses } from '../../domain/specifications/active-me-sap-licenses.specification'
import { ArchiveAbsentLicensesInput, ArchiveAbsentLicensesOutput } from '../dtos/archive-absent-licenses-input.dto'

/**
 * Archiva las licencias ME_SAP activas cuyo material (contractNumber, materialId) no ha aparecido
 * en el run actual. Lo invoca RunSapSyncUseCase solo tras un run 100% exitoso: un fallo de fetch
 * no puede decidir qué materiales existen. Las MANUAL nunca son candidatas (la spec filtra ME_SAP)
 * y las nunca-vistas se descartan en memoria (Criteria no expresa IS NOT NULL).
 */
@Injectable()
export class ArchiveAbsentLicensesService {
  constructor(private readonly licenseRepository: LicenseRepository) {}

  async archive(input: ArchiveAbsentLicensesInput): Promise<ArchiveAbsentLicensesOutput> {
    const seen = new Set(input.seenKeys)
    const archivedAt = new Date(input.archivedAt)
    const candidates = await this.licenseRepository.matching(activeMeSapLicenses())

    let archived = 0
    for (const license of candidates) {
      const primitives = license.toPrimitives()
      if (primitives.lastSeenInSyncAt === null) {
        continue
      }
      const key = `${primitives.contractNumber}#${primitives.materialId}`
      if (seen.has(key)) {
        continue
      }
      license.archive(archivedAt)
      await this.licenseRepository.save(license)
      archived += 1
    }

    return { archived }
  }
}
