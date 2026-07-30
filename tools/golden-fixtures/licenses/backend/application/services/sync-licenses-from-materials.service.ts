import { Injectable } from '@nestjs/common'
import { v7 as uuidv7 } from 'uuid'
import { ContractRepository } from '../../../contracts/domain/contract-repository'
import { ContractNumber } from '../../../../shared/domain/value-objects/contract-number.vo'
import { License } from '../../domain/license'
import { LicenseRepository } from '../../domain/license-repository'
import { withContractAndMaterial } from '../../domain/specifications/license-with-contract-and-material.specification'
import { AppLogger } from '../../../../../shared/domain/logger/logger'
import { messageOf } from '../../../../../shared/utils/error-message'
import {
  SyncLicenseMaterial,
  SyncLicensesFromMaterialsInput,
  SyncLicensesFromMaterialsOutput,
  SyncMaterialFailure
} from '../dtos/sync-licenses-from-materials-input.dto'

/**
 * Crea/actualiza las licencias ME_SAP a partir de los materiales de contrato de SAP (spec 33),
 * por clave natural (contractNumber, materialId). El cliente se resuelve por el contrato (nunca
 * por el CustomerId del material, que es el sold-to). pricePerUnit se siembra solo al crear:
 * en updates se preserva (puede haberlo ajustado un KAM). Materiales de un contrato no registrado
 * se saltan y se cuentan. Las licencias MANUAL nunca entran aquí (la spec filtra source=ME_SAP).
 */
@Injectable()
export class SyncLicensesFromMaterialsService {
  private static readonly CONTEXT = SyncLicensesFromMaterialsService.name

  constructor(
    private readonly licenseRepository: LicenseRepository,
    private readonly contractRepository: ContractRepository,
    private readonly logger: AppLogger
  ) {}

  async sync(input: SyncLicensesFromMaterialsInput): Promise<SyncLicensesFromMaterialsOutput> {
    const seenAt = new Date(input.seenAt)
    let records = 0
    let skipped = 0
    const failures: SyncMaterialFailure[] = []

    for (const material of input.materials) {
      try {
        const written = await this.syncMaterial(material, seenAt)
        if (written) {
          records += 1
        } else {
          skipped += 1
        }
      } catch (error) {
        const reason = messageOf(error)
        this.logger.warn(
          `Failed to sync material ${material.materialId} of contract ${material.contractNumber}: ${reason}`,
          SyncLicensesFromMaterialsService.CONTEXT
        )
        failures.push({ contractNumber: material.contractNumber, materialId: material.materialId, reason })
      }
    }

    return { records, skipped, failures }
  }

  private async syncMaterial(material: SyncLicenseMaterial, seenAt: Date): Promise<boolean> {
    const contract = await this.contractRepository.findByContractNumber(ContractNumber.create(material.contractNumber))
    if (!contract) {
      return false
    }

    const [existing] = await this.licenseRepository.matching(
      withContractAndMaterial(material.contractNumber, material.materialId)
    )

    if (!existing) {
      const license = this.newLicenseFrom(
        material,
        contract.id.value,
        contract.customerId.value,
        contract.customerName.value
      )
      license.markSeenInSync(seenAt)
      await this.licenseRepository.register(license)
      return true
    }

    const before = JSON.stringify(existing.toPrimitives())
    existing.updateDetails({
      contractId: contract.id.value,
      customerId: contract.customerId.value,
      customerName: contract.customerName.value,
      contractNumber: material.contractNumber,
      contractEndDate: material.contractEndDate,
      metricName: material.metricName,
      subSolutionAreaName: material.subSolutionAreaName,
      metric: material.metric,
      licensedUnits: material.licensedUnits,
      // Valor anual autoritativo de SAP (spec 42): un re-sync corrige el existente al AnnualFee actual.
      annualValue: material.annualValue
      // pricePerUnit NO se toca: lo sembró el alta y puede haberlo ajustado el KAM.
    })
    existing.markSeenInSync(seenAt)

    if (JSON.stringify(existing.toPrimitives()) !== before) {
      await this.licenseRepository.save(existing)
    }
    return true
  }

  private newLicenseFrom(
    material: SyncLicenseMaterial,
    contractId: string,
    customerId: string,
    customerName: string
  ): License {
    return License.fromPrimitives({
      id: uuidv7(),
      contractId,
      customerId,
      customerName,
      contractNumber: material.contractNumber,
      contractEndDate: material.contractEndDate,
      // metricId es la clave de consumo (p.ej. CP228), desconocida al crear desde material:
      // el consumo se imputa por área (spec 33), no por metricId.
      metricId: '',
      metricName: material.metricName,
      subSolutionAreaName: material.subSolutionAreaName,
      metric: material.metric,
      licensedUnits: material.licensedUnits,
      pricePerUnit: material.pricePerUnit,
      annualValue: material.annualValue,
      status: 'active',
      source: 'ME_SAP',
      materialId: material.materialId,
      lifecycleStatus: 'active',
      archivedAt: null,
      lastSeenInSyncAt: null,
      currentUnits: 0,
      consumptionPct: 0,
      excessUnits: 0
    })
  }
}
