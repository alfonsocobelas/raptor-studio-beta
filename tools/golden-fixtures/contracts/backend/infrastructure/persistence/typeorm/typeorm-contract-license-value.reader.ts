import { Injectable } from '@nestjs/common'
import { TypeOrmTransactionManager } from '../../../../../../shared/infrastructure/persistence/typeorm/typeorm-transaction-manager'
import { TypeOrmLicenseEntity } from '../../../../licenses/infrastructure/persistence/typeorm/typeorm-license.entity'
import { ContractLicenseValueReader } from '../../../domain/contract-license-value-reader'
import { TypeOrmContractEntity } from './typeorm-contract.entity'

@Injectable()
export class TypeOrmContractLicenseValueReader extends ContractLicenseValueReader {
  constructor(private readonly transactionManager: TypeOrmTransactionManager) {
    super()
  }

  async totalValueByContractIds(contractIds: string[]): Promise<Record<string, number>> {
    if (contractIds.length === 0) {
      return {}
    }

    const rows = await this.transactionManager
      .getEntityManager()
      .getRepository(TypeOrmLicenseEntity)
      .createQueryBuilder('license')
      .select('license.contractId', 'contractId')
      .addSelect('SUM(license.annualValue)', 'total')
      .where('license.contractId IN (:...contractIds)', { contractIds })
      .groupBy('license.contractId')
      .getRawMany<{ contractId: string; total: string }>()

    // SUM() de postgres llega como string (numeric); lo normalizamos a number.
    const totals = Object.fromEntries(rows.map(row => [row.contractId, Number(row.total)]))

    // Fallback maintenance (spec 44): un contrato de mantenimiento no tiene licencias — su valor
    // veraz es el Σ Fee de ISMaintenances, persistido en la columna total_value por el sync.
    // Solo para maintenance: en el resto la columna es vestigial y la verdad son las licencias.
    const maintenanceRows = await this.transactionManager
      .getEntityManager()
      .getRepository(TypeOrmContractEntity)
      .createQueryBuilder('contract')
      .select('contract.id', 'id')
      .addSelect('contract.totalValue', 'total')
      .where('contract.id IN (:...contractIds)', { contractIds })
      .andWhere("contract.contractType = 'maintenance'")
      .getRawMany<{ id: string; total: string }>()

    for (const row of maintenanceRows) {
      totals[row.id] = Number(row.total)
    }

    return totals
  }
}
