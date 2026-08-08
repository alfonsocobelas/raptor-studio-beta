import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type PropiedadEstadoValue = 'disponible' | 'reservada' | 'vendida' | 'retirada'

export class PropiedadEstado extends EnumValueObject<PropiedadEstadoValue> {
  protected static override fieldName = 'Estado'
  static readonly VALUES: readonly PropiedadEstadoValue[] = ['disponible', 'reservada', 'vendida', 'retirada']

  private constructor(value: PropiedadEstadoValue) {
    super(value)
  }

  static create(value: string): PropiedadEstado {
    this.ensureIsValidEnum(value as PropiedadEstadoValue, this.VALUES)
    return new PropiedadEstado(value as PropiedadEstadoValue)
  }
}
