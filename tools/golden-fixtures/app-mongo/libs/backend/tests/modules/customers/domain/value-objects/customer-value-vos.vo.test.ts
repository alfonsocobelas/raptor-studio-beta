import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { CUSTOMER_CONSTRAINTS } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/customer-constants'
import { CustomerError } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/customer-errors'
import { CustomerAddress } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-address.vo'
import { CustomerCity } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-city.vo'
import { CustomerCountry } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-country.vo'
import { CustomerIndustry } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-industry.vo'
import { CustomerNotes } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-notes.vo'
import { SapId } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/sap-id.vo'
import { TaxId } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/tax-id.vo'

describe.each([
  { name: 'CustomerIndustry', Vo: CustomerIndustry, max: CUSTOMER_CONSTRAINTS.INDUSTRY.MAX },
  { name: 'CustomerAddress', Vo: CustomerAddress, max: CUSTOMER_CONSTRAINTS.ADDRESS.MAX },
  { name: 'CustomerNotes', Vo: CustomerNotes, max: CUSTOMER_CONSTRAINTS.NOTES.MAX },
  { name: 'CustomerCity', Vo: CustomerCity, max: CUSTOMER_CONSTRAINTS.CITY.MAX },
  { name: 'CustomerCountry', Vo: CustomerCountry, max: CUSTOMER_CONSTRAINTS.COUNTRY.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(CustomerError)
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

describe('SapId (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => SapId.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => SapId.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => SapId.create('x'.repeat(CUSTOMER_CONSTRAINTS.SAP_ID.MAX + 1))).toThrow(CustomerError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => SapId.create('')).toThrow()
    expect(() => SapId.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => SapId.create('a'.repeat(CUSTOMER_CONSTRAINTS.SAP_ID.MIN - 1))).toThrow()
  })

  it('should throw for inner whitespace', () => {
    const min = CUSTOMER_CONSTRAINTS.SAP_ID.MIN
    expect(() => SapId.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = CUSTOMER_CONSTRAINTS.SAP_ID.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: CUSTOMER_CONSTRAINTS.SAP_ID.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(SapId.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('TaxId (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => TaxId.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => TaxId.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => TaxId.create('x'.repeat(CUSTOMER_CONSTRAINTS.TAX_ID.MAX + 1))).toThrow(CustomerError)
  })

  it('should throw for inner whitespace', () => {
    const min = 1
    expect(() => TaxId.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = 1
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: CUSTOMER_CONSTRAINTS.TAX_ID.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(TaxId.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('SapId — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    const sample = '1'.repeat(CUSTOMER_CONSTRAINTS.SAP_ID.MIN)
    expect(SapId.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '1'.repeat(CUSTOMER_CONSTRAINTS.SAP_ID.MIN)
    expect(() => SapId.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
  })
})

describe('TaxId — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    const sample = '12345'
    expect(TaxId.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '12345'
    expect(() => TaxId.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
  })
})

describe('CustomerIndustry — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(CustomerIndustry.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('CustomerAddress — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(CustomerAddress.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('CustomerNotes — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(CustomerNotes.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('CustomerCity — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(CustomerCity.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('CustomerCountry — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(CustomerCountry.create('  Sample text  ').value).toBe('Sample text')
  })
})
