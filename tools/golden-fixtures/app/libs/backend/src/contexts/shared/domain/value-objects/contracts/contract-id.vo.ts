import { UuidV7ValueObject } from '../uuidv7-value-object'

export class ContractId extends UuidV7ValueObject {
  protected static override fieldName = 'Contract ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ContractId {
    this.ensureIsValidUuidV7(value)
    return new ContractId(value)
  }
}
