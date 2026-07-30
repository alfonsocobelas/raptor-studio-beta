import { InvalidArgumentError } from '../errors'

export enum Operator {
  EQUAL = 'eq',
  NOT_EQUAL = 'neq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  IN = 'in',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with'
}

const VALID_OPERATORS = new Set<string>(Object.values(Operator))

export class FilterOperator {
  private constructor(readonly value: Operator) {}

  static create(value: string): FilterOperator {
    if (!VALID_OPERATORS.has(value)) {
      throw new InvalidArgumentError(`The filter operator "${value}" is invalid`)
    }
    return new FilterOperator(value as Operator)
  }

  isEqual(): boolean {
    return this.value === Operator.EQUAL
  }
  isNotEqual(): boolean {
    return this.value === Operator.NOT_EQUAL
  }
  isGreaterThan(): boolean {
    return this.value === Operator.GT
  }
  isGreaterThanOrEqual(): boolean {
    return this.value === Operator.GTE
  }
  isLessThan(): boolean {
    return this.value === Operator.LT
  }
  isLessThanOrEqual(): boolean {
    return this.value === Operator.LTE
  }
  isIn(): boolean {
    return this.value === Operator.IN
  }
  isContains(): boolean {
    return this.value === Operator.CONTAINS
  }
  isNotContains(): boolean {
    return this.value === Operator.NOT_CONTAINS
  }
  isStartsWith(): boolean {
    return this.value === Operator.STARTS_WITH
  }
  isEndsWith(): boolean {
    return this.value === Operator.ENDS_WITH
  }
}
