import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ProjectStatusValue = 'planning' | 'active' | 'onhold' | 'closed'

export class ProjectStatus extends EnumValueObject<ProjectStatusValue> {
  protected static override fieldName = 'Project status'
  static readonly VALUES: readonly ProjectStatusValue[] = ['planning', 'active', 'onhold', 'closed']

  private constructor(value: ProjectStatusValue) {
    super(value)
  }

  static create(value: string): ProjectStatus {
    this.ensureIsValidEnum(value as ProjectStatusValue, this.VALUES)
    return new ProjectStatus(value as ProjectStatusValue)
  }
}
