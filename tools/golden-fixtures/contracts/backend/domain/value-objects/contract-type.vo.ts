import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

// mixed (spec 39): contrato real presente en ambos feeds SAP (componentes cloud + on-prem);
// lo produce el merge del sync, no la entrada manual.
// maintenance (spec 44): agregado de ISMaintenances por ID de SAP; contractNumber puede ser null
// (36% de las filas traen ContractID: "N/A" — la identidad real es cmsCaseId).
export type ContractTypeValue = 'cloud' | 'onprem' | 'mixed' | 'maintenance'

export class ContractType extends EnumValueObject<ContractTypeValue> {
  protected static override fieldName = 'Contract type'
  static readonly VALUES: readonly ContractTypeValue[] = ['cloud', 'onprem', 'mixed', 'maintenance']

  private constructor(value: ContractTypeValue) {
    super(value)
  }

  static create(value: string): ContractType {
    this.ensureIsValidEnum(value as ContractTypeValue, this.VALUES)
    return new ContractType(value as ContractTypeValue)
  }

  requiresContractNumber(): boolean {
    return this.value !== 'maintenance'
  }

  requiresStartDate(): boolean {
    return this.value !== 'maintenance'
  }
}
