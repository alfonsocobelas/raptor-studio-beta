import { EnumValueObject } from '../../../../../shared/domain/value-objects/enum-value-object'

// Eje de ciclo de vida gobernado por el sync (spec 33), distinto del status de negocio
// (active|suspended|expired): 'archived' = el material dejó de aparecer en los feeds de SAP.
export type LicenseLifecycleStatusValue = 'active' | 'archived'

export class LicenseLifecycleStatus extends EnumValueObject<LicenseLifecycleStatusValue> {
  protected static override fieldName = 'License lifecycle status'
  static readonly VALUES: readonly LicenseLifecycleStatusValue[] = ['active', 'archived']

  private constructor(value: LicenseLifecycleStatusValue) {
    super(value)
  }

  static create(value: string): LicenseLifecycleStatus {
    this.ensureIsValidEnum(value as LicenseLifecycleStatusValue, this.VALUES)
    return new LicenseLifecycleStatus(value as LicenseLifecycleStatusValue)
  }

  static active(): LicenseLifecycleStatus {
    return new LicenseLifecycleStatus('active')
  }

  static archived(): LicenseLifecycleStatus {
    return new LicenseLifecycleStatus('archived')
  }

  isActive(): boolean {
    return this.value === 'active'
  }

  isArchived(): boolean {
    return this.value === 'archived'
  }
}
