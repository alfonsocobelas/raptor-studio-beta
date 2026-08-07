import { Nullable } from '../../../../shared/domain/types'
import { DateValueObject } from '../../../../shared/domain/value-objects/date-value-object'

export class ContractDate extends DateValueObject {
  protected static override fieldName = 'Contract date'

  private constructor(value: Date) {
    super(value)
  }

  static create(value: Date): ContractDate {
    this.ensureIsValidDate(value)
    return new ContractDate(value)
  }

  static unset(): Nullable<ContractDate> {
    return null
  }
}
