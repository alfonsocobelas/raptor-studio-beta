import { ValueObject } from '../../../../../shared/domain/value-objects/value-object'
import { ContractError } from '../contract-errors'

export class SubSolutionAreas extends ValueObject<string[]> {
  protected static override fieldName = 'Sub solution areas'

  private constructor(value: string[]) {
    super(value)
  }

  static create(value: string[]): SubSolutionAreas {
    if (!Array.isArray(value) || value.some(area => typeof area !== 'string')) {
      throw new ContractError('Sub solution areas must be an array of strings')
    }

    return new SubSolutionAreas(value)
  }
}
