import { Order } from './order'

export class Orders {
  constructor(readonly orders: Order[]) {}

  static fromValues(orders: Array<Map<string, string>>): Orders {
    return new Orders(orders.map(Order.fromValues))
  }

  static empty(): Orders {
    return new Orders([])
  }
}
