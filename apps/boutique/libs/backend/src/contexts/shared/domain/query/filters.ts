import { Filter } from './filter'

export class Filters {
  constructor(readonly filters: Filter[]) {}

  static fromValues(filters: Array<Map<string, string>>): Filters {
    return new Filters(filters.map(Filter.fromValues))
  }

  static empty(): Filters {
    return new Filters([])
  }
}
