import { InvalidArgumentError } from '../errors'
import { FilterField } from './filter-field'
import { FilterOperator } from './filter-operator'
import { FilterValue } from './filter-value'

export class Filter {
  constructor(
    readonly field: FilterField,
    readonly operator: FilterOperator,
    readonly value: FilterValue
  ) {}

  static fromValues(map: Map<string, string>): Filter {
    const field = map.get('field')
    const operator = map.get('operator')
    const value = map.get('value')

    if (!field || !operator || value === undefined) {
      throw new InvalidArgumentError('Invalid filter values')
    }

    const filterOperator = FilterOperator.create(operator)
    const filterValue = filterOperator.isIn() ? FilterValue.createList(value) : FilterValue.create(value)

    return new Filter(FilterField.create(field), filterOperator, filterValue)
  }
}
