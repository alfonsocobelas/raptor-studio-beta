import { InvalidArgumentError } from '../errors'

export class OrderBy {
  private constructor(readonly value: string) {}

  static create(value: string): OrderBy {
    if (!value || !value.trim().length) {
      throw new InvalidArgumentError('OrderBy value cannot be empty')
    }
    return new OrderBy(value)
  }
}
