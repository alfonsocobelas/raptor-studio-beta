import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

// Distingue altas manuales de las sembradas por el sync (spec 46), precedente ContractOrigin.
// Sin claimBySync: manual y ME_SAP conviven, la clave ME_SAP (sapProjectId) nunca la tiene un manual.
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

  static manual(): ProjectOrigin {
    return new ProjectOrigin('MANUAL')
  }

  static meSap(): ProjectOrigin {
    return new ProjectOrigin('ME_SAP')
  }

  isManual(): boolean {
    return this.value === 'MANUAL'
  }

  requiresStartDate(): boolean {
    return this.value !== 'ME_SAP'
  }
}
