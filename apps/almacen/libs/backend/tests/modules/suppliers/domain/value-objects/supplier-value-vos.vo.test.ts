import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { SUPPLIER_CONSTRAINTS } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/supplier-constants'
import { SupplierError } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/supplier-errors'
import { LeadTimeDays } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/lead-time-days.vo'
import { SupplierCity } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-city.vo'
import { SupplierEmail } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-email.vo'
import { SupplierName } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-name.vo'
import { SupplierPhone } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-phone.vo'
import { SupplierTaxId } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-tax-id.vo'

describe('LeadTimeDays', () => {
  it('should throw for a non-number', () => {
    expect(() => LeadTimeDays.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => LeadTimeDays.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: SUPPLIER_CONSTRAINTS.LEAD_TIME.MIN - 1 }), value => {
        expect(() => LeadTimeDays.create(value)).toThrow(SupplierError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(LeadTimeDays.create(SUPPLIER_CONSTRAINTS.LEAD_TIME.MIN).value).toBe(SUPPLIER_CONSTRAINTS.LEAD_TIME.MIN)
    expect(LeadTimeDays.create(SUPPLIER_CONSTRAINTS.LEAD_TIME.MIN + 100).value).toBe(
      SUPPLIER_CONSTRAINTS.LEAD_TIME.MIN + 100
    )
  })
})

describe.each([
  { name: 'SupplierPhone', Vo: SupplierPhone, max: SUPPLIER_CONSTRAINTS.PHONE.MAX },
  { name: 'SupplierCity', Vo: SupplierCity, max: SUPPLIER_CONSTRAINTS.CITY.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(SupplierError)
  })

  it('should accept any string up to the max', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: max }).map(v => v.trim()),
        value => {
          expect(Vo.create(value).value).toBe(value)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('SupplierName (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => SupplierName.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => SupplierName.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => SupplierName.create('x'.repeat(SUPPLIER_CONSTRAINTS.NAME.MAX + 1))).toThrow(SupplierError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => SupplierName.create('')).toThrow()
    expect(() => SupplierName.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => SupplierName.create('a'.repeat(SUPPLIER_CONSTRAINTS.NAME.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = SUPPLIER_CONSTRAINTS.NAME.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: SUPPLIER_CONSTRAINTS.NAME.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(SupplierName.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('SupplierTaxId (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => SupplierTaxId.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => SupplierTaxId.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => SupplierTaxId.create('x'.repeat(SUPPLIER_CONSTRAINTS.TAX_ID.MAX + 1))).toThrow(SupplierError)
  })

  it('should throw for inner whitespace', () => {
    const min = 1
    expect(() => SupplierTaxId.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = 1
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: SUPPLIER_CONSTRAINTS.TAX_ID.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(SupplierTaxId.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('SupplierEmail (email)', () => {
  it('should accept an empty string (optional field)', () => {
    expect(SupplierEmail.create('').value).toBe('')
  })

  it('should throw for a non-email string', () => {
    expect(() => SupplierEmail.create('not-an-email')).toThrow(SupplierError)
  })

  it('should throw when longer than the max', () => {
    expect(() => SupplierEmail.create(`${'a'.repeat(SUPPLIER_CONSTRAINTS.EMAIL.MAX)}@mail.com`)).toThrow(SupplierError)
  })

  it('should accept and preserve valid emails', () => {
    fc.assert(
      fc.property(
        fc.emailAddress().filter(v => v.length <= SUPPLIER_CONSTRAINTS.EMAIL.MAX),
        value => {
          expect(SupplierEmail.create(value).value).toBe(value)
        }
      ),
      { numRuns: 50 }
    )
  })
})

describe('SupplierName — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(SupplierName.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('SupplierTaxId — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(SupplierTaxId.create('  12345  ').value).toBe('12345')
  })

  it('should throw for inner whitespace (code field)', () => {
    expect(() => SupplierTaxId.create('12 345')).toThrow(InvalidArgumentError)
  })
})

describe('SupplierPhone — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(SupplierPhone.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('SupplierCity — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(SupplierCity.create('  Sample text  ').value).toBe('Sample text')
  })
})
