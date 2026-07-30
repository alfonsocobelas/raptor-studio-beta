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
  { name: 'SapId', Vo: SapId, max: CUSTOMER_CONSTRAINTS.SAP_ID.MAX },
  { name: 'TaxId', Vo: TaxId, max: CUSTOMER_CONSTRAINTS.TAX_ID.MAX },
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

describe('SapId — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(SapId.create('  12345  ').value).toBe('12345')
  })

  it('should throw for inner whitespace (code field)', () => {
    expect(() => SapId.create('12 345')).toThrow(InvalidArgumentError)
  })
})

describe('TaxId — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(TaxId.create('  12345  ').value).toBe('12345')
  })

  it('should throw for inner whitespace (code field)', () => {
    expect(() => TaxId.create('12 345')).toThrow(InvalidArgumentError)
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
