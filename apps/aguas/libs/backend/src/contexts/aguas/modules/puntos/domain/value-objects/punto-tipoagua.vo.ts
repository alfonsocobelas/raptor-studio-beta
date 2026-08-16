import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type PuntoTipoaguaValue = 'potable' | 'riego' | 'residual' | 'proceso'

export class PuntoTipoagua extends EnumValueObject<PuntoTipoaguaValue> {
  protected static override fieldName = 'Tipo de agua'
  static readonly VALUES: readonly PuntoTipoaguaValue[] = ['potable', 'riego', 'residual', 'proceso']

  private constructor(value: PuntoTipoaguaValue) {
    super(value)
  }

  static create(value: string): PuntoTipoagua {
    this.ensureIsValidEnum(value as PuntoTipoaguaValue, this.VALUES)
    return new PuntoTipoagua(value as PuntoTipoaguaValue)
  }
}
