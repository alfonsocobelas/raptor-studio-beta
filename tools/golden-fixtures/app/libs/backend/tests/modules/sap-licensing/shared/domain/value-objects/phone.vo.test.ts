import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../../src/contexts/shared/domain/errors'
import { Phone } from '../../../../../../src/contexts/sap-licensing/shared/domain/value-objects/phone.vo'
import { SHARED_CONSTRAINTS } from '../../../../../../src/contexts/sap-licensing/shared/domain/constants'

const MAX = SHARED_CONSTRAINTS.PHONE.MAX
const VALID = '1'

describe('Phone (shared)', () => {
  describe('create — invalid inputs', () => {
    it('should throw InvalidArgumentError for null', () => {
      expect(() => Phone.create(null as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for undefined', () => {
      expect(() => Phone.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for strings exceeding MAX chars', () => {
      expect(() => Phone.create('1'.repeat(MAX + 1))).toThrow(InvalidArgumentError)
    })
  })

  describe('create — valid inputs', () => {
    it('should accept an empty string', () => {
      expect(Phone.create('').value).toBe('')
    })

    it('should preserve a valid value', () => {
      expect(Phone.create(VALID).value).toBe(VALID)
    })

    it('should accept strings with exactly MAX chars', () => {
      const value = '1'.repeat(MAX)
      expect(Phone.create(value).value).toBe(value)
    })

    it('should preserve any allowed value within bounds', () => {
      // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
      const allowed = fc
        .array(fc.constantFrom(...'0123456789+()-/.'.split('')), { minLength: 1, maxLength: MAX })
        .map(chars => chars.join(''))
      fc.assert(
        fc.property(allowed, value => {
          expect(Phone.create(value).value).toBe(value)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('create — character allowlist', () => {
    it('should throw for characters outside the allowed set', () => {
      for (const bad of ['@', '#', '_', ',', ';', 'a']) {
        expect(() => Phone.create(`${VALID}${bad}`)).toThrow(InvalidArgumentError)
      }
    })
  })

  describe('sanitization', () => {
    it('should trim leading and trailing whitespace', () => {
      expect(Phone.create(`  ${VALID}  `).value).toBe(VALID)
    })

    it('should collapse multiple inner spaces to one', () => {
      expect(Phone.create(`${VALID}   ${VALID}`).value).toBe(`${VALID} ${VALID}`)
    })
  })

  describe('equals', () => {
    it('should return true for the same value', () => {
      expect(Phone.create(VALID).equals(Phone.create(VALID))).toBe(true)
    })

    it('should return false for different values', () => {
      const other = '2'
      expect(Phone.create(VALID).equals(Phone.create(other))).toBe(false)
    })
  })
})
