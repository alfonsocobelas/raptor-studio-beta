import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { CONTRACT_CONSTRAINTS } from '../contract-constants'
import { ContractError } from '../contract-errors'

// Texto libre, no enum (spec 44): las capturas solo muestran "Enterprise"/"Standard support",
// pero es un campo gobernado por el sync — no debe romper si SAP añade un valor no visto.
export class SupportModel extends StringValueObject {
  protected static override fieldName = 'Support model'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SupportModel {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > CONTRACT_CONSTRAINTS.SUPPORT_MODEL.MAX) {
      throw new ContractError(`Support model must be at most ${CONTRACT_CONSTRAINTS.SUPPORT_MODEL.MAX} characters`)
    }

    return new SupportModel(value)
  }
}
