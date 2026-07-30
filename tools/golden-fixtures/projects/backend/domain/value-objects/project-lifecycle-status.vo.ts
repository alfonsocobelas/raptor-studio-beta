import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ProjectLifecycleStatusValue = 'active' | 'archived'

export class ProjectLifecycleStatus extends EnumValueObject<ProjectLifecycleStatusValue> {
  protected static override fieldName = 'Project lifecycle status'
  static readonly VALUES: readonly ProjectLifecycleStatusValue[] = ['active', 'archived']

  private constructor(value: ProjectLifecycleStatusValue) {
    super(value)
  }

  static create(value: string): ProjectLifecycleStatus {
    this.ensureIsValidEnum(value as ProjectLifecycleStatusValue, this.VALUES)
    return new ProjectLifecycleStatus(value as ProjectLifecycleStatusValue)
  }
}
