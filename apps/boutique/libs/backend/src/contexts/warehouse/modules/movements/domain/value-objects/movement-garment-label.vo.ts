import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { MOVEMENT_CONSTRAINTS } from '../movement-constants'
import { MovementError } from '../movement-errors'

export class MovementGarmentLabel extends StringValueObject {
  protected static override fieldName = 'Movement garment'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): MovementGarmentLabel {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < MOVEMENT_CONSTRAINTS.GARMENT_LABEL.MIN) {
      throw new MovementError(`Movement garment must be at least ${MOVEMENT_CONSTRAINTS.GARMENT_LABEL.MIN} characters`)
    }

    if (value.length > MOVEMENT_CONSTRAINTS.GARMENT_LABEL.MAX) {
      throw new MovementError(`Movement garment must be at most ${MOVEMENT_CONSTRAINTS.GARMENT_LABEL.MAX} characters`)
    }

    return new MovementGarmentLabel(value)
  }
}
