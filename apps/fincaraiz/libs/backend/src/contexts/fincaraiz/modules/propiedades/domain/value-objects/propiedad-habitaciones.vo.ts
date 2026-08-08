import { IntegerValueObject } from '../../../../../shared/domain/value-objects/integer-value-object'
import { PROPIEDAD_CONSTRAINTS } from '../propiedad-constants'
import { PropiedadError } from '../propiedad-errors'

export class PropiedadHabitaciones extends IntegerValueObject {
  protected static override fieldName = 'Habitaciones'

  private constructor(value: number) {
    super(value)
  }

  static create(value: number): PropiedadHabitaciones {
    this.ensureIsInteger(value)

    if (value < PROPIEDAD_CONSTRAINTS.HABITACIONES.MIN) {
      throw new PropiedadError(`Habitaciones must be at least ${PROPIEDAD_CONSTRAINTS.HABITACIONES.MIN}`)
    }

    return new PropiedadHabitaciones(value)
  }
}
