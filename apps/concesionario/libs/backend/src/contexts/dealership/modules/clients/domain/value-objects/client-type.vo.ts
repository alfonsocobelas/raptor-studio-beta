import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ClientTypeValue = 'individual' | 'company'

export class ClientType extends EnumValueObject<ClientTypeValue> {
  protected static override fieldName = 'Client type'
  static readonly VALUES: readonly ClientTypeValue[] = ['individual', 'company']

  private constructor(value: ClientTypeValue) {
    super(value)
  }

  static create(value: string): ClientType {
    this.ensureIsValidEnum(value as ClientTypeValue, this.VALUES)
    return new ClientType(value as ClientTypeValue)
  }
}
