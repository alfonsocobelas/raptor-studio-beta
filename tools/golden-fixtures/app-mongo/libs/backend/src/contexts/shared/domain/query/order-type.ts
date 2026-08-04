import { InvalidArgumentError } from '../errors'

export enum OrderTypes {
  ASC = 'asc',
  DESC = 'desc'
}

const VALID_ORDER_TYPES = new Set<string>(Object.values(OrderTypes))

export class OrderType {
  private constructor(readonly value: OrderTypes) {}

  static create(value: string): OrderType {
    if (!VALID_ORDER_TYPES.has(value)) {
      throw new InvalidArgumentError(`The order type "${value}" is invalid`)
    }
    return new OrderType(value as OrderTypes)
  }

  isAsc(): boolean {
    return this.value === OrderTypes.ASC
  }
  isDesc(): boolean {
    return this.value === OrderTypes.DESC
  }
}
