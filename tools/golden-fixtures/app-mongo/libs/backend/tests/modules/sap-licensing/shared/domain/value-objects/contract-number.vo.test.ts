import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../../src/contexts/shared/domain/errors'
import { ContractNumber } from '../../../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-number.vo'
import { SHARED_CONSTRAINTS } from '../../../../../../src/contexts/sap-licensing/shared/domain/constants'

const MIN = SHARED_CONSTRAINTS.CONTRACT_NUMBER.MIN
const MAX = SHARED_CONSTRAINTS.CONTRACT_NUMBER.MAX
const VALID = '1'.repeat(MIN)

describe('ContractNumber (shared)', () => {
  describe('create — invalid inputs', () => {
    it('should throw InvalidArgumentError for null', () => {
      expect(() => ContractNumber.create(null as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for undefined', () => {
      expect(() => ContractNumber.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for an empty or whitespace-only string', () => {
      expect(() => ContractNumber.create('')).toThrow(InvalidArgumentError)
      expect(() => ContractNumber.create('   ')).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for strings shorter than MIN chars', () => {
      expect(() => ContractNumber.create('1'.repeat(MIN - 1))).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for strings exceeding MAX chars', () => {
      expect(() => ContractNumber.create('1'.repeat(MAX + 1))).toThrow(InvalidArgumentError)
    })
  })

  describe('create — valid inputs', () => {
    it('should preserve a valid value', () => {
      expect(ContractNumber.create(VALID).value).toBe(VALID)
    })

    it('should accept strings with exactly MAX chars', () => {
      const value = '1'.repeat(MAX)
      expect(ContractNumber.create(value).value).toBe(value)
    })

    it('should preserve any allowed value within bounds', () => {
      // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
      const allowed = fc
        .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: MIN, maxLength: MAX })
        .map(chars => chars.join(''))
      fc.assert(
        fc.property(allowed, value => {
          expect(ContractNumber.create(value).value).toBe(value)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('sanitization', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(ContractNumber.create(`  ${VALID}  `).value).toBe(VALID)
    })

    it('should throw for inner whitespace (code field)', () => {
      expect(() => ContractNumber.create(`${VALID} ${VALID}`)).toThrow(InvalidArgumentError)
    })
  })

  describe('equals', () => {
    it('should return true for the same value', () => {
      expect(ContractNumber.create(VALID).equals(ContractNumber.create(VALID))).toBe(true)
    })

    it('should return false for different values', () => {
      const other = '2'.repeat(MIN)
      expect(ContractNumber.create(VALID).equals(ContractNumber.create(other))).toBe(false)
    })
  })
})
