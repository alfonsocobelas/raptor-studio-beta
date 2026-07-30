import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

// Distingue altas manuales de las sembradas por el sync (spec 44), precedente LicenseSource.
// Eje distinto de ContractSource (dimensión comercial AVVALE_SOLD/CUSTOMER_OWNED).
export type ContractOriginValue = 'ME_SAP' | 'MANUAL'

export class ContractOrigin extends EnumValueObject<ContractOriginValue> {
  protected static override fieldName = 'Contract origin'
  static readonly VALUES: readonly ContractOriginValue[] = ['ME_SAP', 'MANUAL']

  private constructor(value: ContractOriginValue) {
    super(value)
  }

  static create(value: string): ContractOrigin {
    this.ensureIsValidEnum(value as ContractOriginValue, this.VALUES)
    return new ContractOrigin(value as ContractOriginValue)
  }

  static manual(): ContractOrigin {
    return new ContractOrigin('MANUAL')
  }

  static meSap(): ContractOrigin {
    return new ContractOrigin('ME_SAP')
  }

  isManual(): boolean {
    return this.value === 'MANUAL'
  }
}
