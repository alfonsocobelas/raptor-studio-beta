import { License } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/license'
import { LicensePrimitiveProps } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/license-types'
import { LicenseBuilder } from './license.builder'

export class LicenseMother {
  static random(): License {
    return LicenseBuilder.aLicense().build()
  }

  static randomList(count: number = 5): License[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<LicensePrimitiveProps>): License {
    return LicenseBuilder.aLicense().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<LicensePrimitiveProps>): License {
    return LicenseBuilder.aLicense().withProps(overrides).build()
  }

  static primitives(overrides?: Partial<LicensePrimitiveProps>): LicensePrimitiveProps {
    return LicenseBuilder.aLicense().withProps(overrides).build().toPrimitives()
  }
}
