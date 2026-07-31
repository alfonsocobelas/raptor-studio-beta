import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CONTRACT_CONSTRAINTS } from '../contract-constants'
import { ContractError } from '../contract-errors'

export class BusinessModel extends StringValueObject {
  protected static override fieldName = 'Business model'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): BusinessModel {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CONTRACT_CONSTRAINTS.BUSINESS_MODEL.MAX) {
      throw new ContractError(`Business model must be at most ${CONTRACT_CONSTRAINTS.BUSINESS_MODEL.MAX} characters`)
    }

    return new BusinessModel(value)
  }
}
