import { Nullable } from '../../../../shared/domain/types'
import { Criteria } from '../../../../shared/domain/query/criteria'
import { ContractId } from '../../../../shared/domain/value-objects/contracts/contract-id.vo'
import { ContractNumber } from '../../../shared/domain/value-objects/contract-number.vo'
import { Contract } from './contract'
import { CmsCaseId } from './value-objects/cms-case-id.vo'

export abstract class ContractRepository {
  abstract register(contract: Contract): Promise<void>
  abstract save(contract: Contract): Promise<void>
  abstract get(contractId: ContractId): Promise<Nullable<Contract>>
  abstract matching(criteria: Criteria): Promise<Contract[]>
  abstract findByContractNumber(contractNumber: ContractNumber): Promise<Nullable<Contract>>
  // Identidad de upsert/archivado de los contratos maintenance (spec 44): pivota sobre cmsCaseId
  // (= ID de SAP), no sobre contractNumber (36% de ISMaintenances trae ContractID: "N/A").
  abstract findMaintenanceByCaseId(cmsCaseId: CmsCaseId): Promise<Nullable<Contract>>
  abstract exists(criteria: Criteria): Promise<boolean>
  abstract count(criteria: Criteria): Promise<number>
}
