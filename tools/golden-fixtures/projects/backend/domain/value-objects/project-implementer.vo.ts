import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ProjectImplementerValue = 'AVVALE' | 'THIRD_PARTY'

export class ProjectImplementer extends EnumValueObject<ProjectImplementerValue> {
  protected static override fieldName = 'Project implementer'
  static readonly VALUES: readonly ProjectImplementerValue[] = ['AVVALE', 'THIRD_PARTY']

  private constructor(value: ProjectImplementerValue) {
    super(value)
  }

  static create(value: string): ProjectImplementer {
    this.ensureIsValidEnum(value as ProjectImplementerValue, this.VALUES)
    return new ProjectImplementer(value as ProjectImplementerValue)
  }
}
