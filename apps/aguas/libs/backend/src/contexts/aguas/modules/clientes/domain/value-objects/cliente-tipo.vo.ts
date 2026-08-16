import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ClienteTipoValue = 'ayuntamiento' | 'regantes' | 'alimentacion'

export class ClienteTipo extends EnumValueObject<ClienteTipoValue> {
  protected static override fieldName = 'Tipo'
  static readonly VALUES: readonly ClienteTipoValue[] = ['ayuntamiento', 'regantes', 'alimentacion']

  private constructor(value: ClienteTipoValue) {
    super(value)
  }

  static create(value: string): ClienteTipo {
    this.ensureIsValidEnum(value as ClienteTipoValue, this.VALUES)
    return new ClienteTipo(value as ClienteTipoValue)
  }
}
