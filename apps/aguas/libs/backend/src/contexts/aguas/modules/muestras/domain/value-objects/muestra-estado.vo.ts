import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type MuestraEstadoValue = 'recibida' | 'en_analisis' | 'fuera_de_rango' | 'validada' | 'informada' | 'facturada'

export class MuestraEstado extends EnumValueObject<MuestraEstadoValue> {
  protected static override fieldName = 'Estado'
  static readonly VALUES: readonly MuestraEstadoValue[] = [
    'recibida',
    'en_analisis',
    'fuera_de_rango',
    'validada',
    'informada',
    'facturada'
  ]

  private constructor(value: MuestraEstadoValue) {
    super(value)
  }

  static create(value: string): MuestraEstado {
    this.ensureIsValidEnum(value as MuestraEstadoValue, this.VALUES)
    return new MuestraEstado(value as MuestraEstadoValue)
  }
}
