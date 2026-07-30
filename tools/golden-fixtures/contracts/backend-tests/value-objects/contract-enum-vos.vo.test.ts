import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { ValueObject } from '../../../../../src/contexts/shared/domain/value-objects/value-object'
import { ContractType } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-type.vo'
import { ContractStatus } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-status.vo'
import { ContractSource } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-source.vo'
import { BillingFrequency } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/billing-frequency.vo'
import { RenewalType } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/renewal-type.vo'
import { ContractOrigin } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-origin.vo'
import { ContractLifecycleStatus } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-lifecycle-status.vo'

type EnumVoFactory = { create(value: string): ValueObject<string>; VALUES: readonly string[] }

const enumVos: { name: string; Vo: EnumVoFactory; values: readonly string[] }[] = [
  { name: 'ContractType', Vo: ContractType, values: ['cloud', 'onprem', 'mixed', 'maintenance'] },
  { name: 'ContractStatus', Vo: ContractStatus, values: ['active', 'expiring', 'expired', 'terminated'] },
  { name: 'ContractSource', Vo: ContractSource, values: ['AVVALE_SOLD', 'CUSTOMER_OWNED'] },
  { name: 'BillingFrequency', Vo: BillingFrequency, values: ['monthly', 'quarterly', 'semiannual', 'yearly'] },
  { name: 'RenewalType', Vo: RenewalType, values: ['auto', 'manual', 'none'] },
  { name: 'ContractOrigin', Vo: ContractOrigin, values: ['ME_SAP', 'MANUAL'] },
  { name: 'ContractLifecycleStatus', Vo: ContractLifecycleStatus, values: ['active', 'archived'] }
]

describe.each(enumVos)('$name', ({ Vo, values }) => {
  describe('create', () => {
    it('should accept every allowed value and preserve it', () => {
      for (const value of values) {
        expect(Vo.create(value).value).toBe(value)
      }
    })

    it('should expose the allowed values in VALUES', () => {
      expect([...Vo.VALUES]).toEqual([...values])
    })

    it('should throw InvalidArgumentError for empty string', () => {
      expect(() => Vo.create('')).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for any value outside the allowed set', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(v => v.trim().length > 0 && !(values as readonly string[]).includes(v)),
          value => {
            expect(() => Vo.create(value)).toThrow(InvalidArgumentError)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('equals', () => {
    it('should return true for the same value', () => {
      expect(Vo.create(values[0]).equals(Vo.create(values[0]))).toBe(true)
    })

    it('should return false for different values', () => {
      expect(Vo.create(values[0]).equals(Vo.create(values[1]))).toBe(false)
    })
  })
})
