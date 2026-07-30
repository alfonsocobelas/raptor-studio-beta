import { InvalidArgumentError } from '../errors'
import { OrderBy } from './order-by'
import { OrderType } from './order-type'

export class Order {
  constructor(
    readonly orderBy: OrderBy,
    readonly orderType: OrderType
  ) {}

  static fromValues(map: Map<string, string>): Order {
    const orderBy = map.get('orderBy')
    const orderType = map.get('orderType')

    if (!orderBy || !orderType) {
      throw new InvalidArgumentError('Invalid order values')
    }

    return new Order(OrderBy.create(orderBy), OrderType.create(orderType))
  }
}
