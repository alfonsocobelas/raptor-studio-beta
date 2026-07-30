import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { CLIENT_CONSTRAINTS } from '../../../../../src/contexts/dealership/modules/clients/domain/client-constants'
import { ClientError } from '../../../../../src/contexts/dealership/modules/clients/domain/client-errors'
import { ClientAddress } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-address.vo'
import { ClientCity } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-city.vo'
import { ClientEmail } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-email.vo'
import { ClientName } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-name.vo'
import { ClientNotes } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-notes.vo'
import { ClientPhone } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-phone.vo'
import { ClientTaxId } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-tax-id.vo'

describe.each([
  { name: 'ClientName', Vo: ClientName, max: CLIENT_CONSTRAINTS.NAME.MAX },
  { name: 'ClientTaxId', Vo: ClientTaxId, max: CLIENT_CONSTRAINTS.TAX_ID.MAX },
  { name: 'ClientEmail', Vo: ClientEmail, max: CLIENT_CONSTRAINTS.EMAIL.MAX },
  { name: 'ClientPhone', Vo: ClientPhone, max: CLIENT_CONSTRAINTS.PHONE.MAX },
  { name: 'ClientCity', Vo: ClientCity, max: CLIENT_CONSTRAINTS.CITY.MAX },
  { name: 'ClientAddress', Vo: ClientAddress, max: CLIENT_CONSTRAINTS.ADDRESS.MAX },
  { name: 'ClientNotes', Vo: ClientNotes, max: CLIENT_CONSTRAINTS.NOTES.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(ClientError)
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

describe('ClientName — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ClientName.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ClientTaxId — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(ClientTaxId.create('  12345  ').value).toBe('12345')
  })

  it('should throw for inner whitespace (code field)', () => {
    expect(() => ClientTaxId.create('12 345')).toThrow(InvalidArgumentError)
  })
})

describe('ClientEmail — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ClientEmail.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ClientPhone — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ClientPhone.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ClientCity — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ClientCity.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ClientAddress — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ClientAddress.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ClientNotes — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ClientNotes.create('  Sample text  ').value).toBe('Sample text')
  })
})
