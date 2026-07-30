import { InvalidArgumentError } from '../errors'

export type FilterValueType = string | number | boolean | string[]

export class FilterValue {
  private constructor(readonly value: FilterValueType) {}

  static create(value: FilterValueType): FilterValue {
    return new FilterValue(value)
  }

  // El operador in recibe el valor como string con comas (el pipe HTTP aplana los arrays JSON
  // con String()), así que la lista se reconstruye aquí: split, trim y descarte de vacíos.
  static createList(raw: string): FilterValue {
    const values = raw
      .split(',')
      .map(value => value.trim())
      .filter(value => value.length > 0)

    if (!values.length) {
      throw new InvalidArgumentError('Invalid filter values')
    }

    return new FilterValue(values)
  }
}
