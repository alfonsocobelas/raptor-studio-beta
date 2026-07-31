import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

export type ProjectOriginValue = 'MANUAL' | 'ME_SAP'

export class ProjectOrigin extends EnumValueObject<ProjectOriginValue> {
  protected static override fieldName = 'Project origin'
  static readonly VALUES: readonly ProjectOriginValue[] = ['MANUAL', 'ME_SAP']

  private constructor(value: ProjectOriginValue) {
    super(value)
  }

  static create(value: string): ProjectOrigin {
    this.ensureIsValidEnum(value as ProjectOriginValue, this.VALUES)
    return new ProjectOrigin(value as ProjectOriginValue)
  }
}
