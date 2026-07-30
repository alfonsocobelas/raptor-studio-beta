import { InvalidArgumentError } from '../errors'
import { Filters } from './filters'
import { Orders } from './orders'

export class CriteriaValidator {
  static validateFilters(filters: Filters, allowedFields: string[]): void {
    filters.filters.forEach(filter => {
      if (!allowedFields.includes(filter.field.value)) {
        throw new InvalidArgumentError(`The field "${filter.field.value}" is not allowed for searching.`)
      }
    })
  }

  static validateOrders(orders: Orders, allowedFields: string[]): void {
    orders.orders.forEach(order => {
      if (!allowedFields.includes(order.orderBy.value)) {
        throw new InvalidArgumentError(`The field "${order.orderBy.value}" is not allowed for ordering.`)
      }
    })
  }
}
