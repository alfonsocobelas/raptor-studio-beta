import { v7 as uuidv7, validate as uuidValidate, version as uuidVersion } from 'uuid'
import { InvalidArgumentError } from '../errors'
import { ValueObject } from './value-object'

export class UuidV7ValueObject extends ValueObject<string> {
  constructor(value: string) {
    super(value)
  }

  static random(): UuidV7ValueObject {
    return new UuidV7ValueObject(uuidv7())
  }

  protected static ensureIsValidUuidV7(value: string): void {
    const isUuidV7 = uuidValidate(value) && uuidVersion(value) === 7
    if (!isUuidV7) {
      throw new InvalidArgumentError(`${this.fieldName} must be a valid UUID v7`)
    }
  }
}
