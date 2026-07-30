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
  { name: 'SupplierName', Vo: SupplierName, max: SUPPLIER_CONSTRAINTS.NAME.MAX },
  { name: 'SupplierTaxId', Vo: SupplierTaxId, max: SUPPLIER_CONSTRAINTS.TAX_ID.MAX },
  { name: 'SupplierEmail', Vo: SupplierEmail, max: SUPPLIER_CONSTRAINTS.EMAIL.MAX },
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

describe('SupplierEmail — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(SupplierEmail.create('  Sample text  ').value).toBe('Sample text')
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
