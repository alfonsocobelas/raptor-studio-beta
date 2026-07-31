import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CONTRACT_CONSTRAINTS } from '../contract-constants'
import { ContractError } from '../contract-errors'

export class CmsCaseId extends StringValueObject {
  protected static override fieldName = 'CMS case ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): CmsCaseId {
    this.ensureIsDefined(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length > CONTRACT_CONSTRAINTS.CMS_CASE_ID.MAX) {
      throw new ContractError(`CMS case ID must be at most ${CONTRACT_CONSTRAINTS.CMS_CASE_ID.MAX} characters`)
    }

    return new CmsCaseId(value)
  }
}
