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

describe('ClientName (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => ClientName.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => ClientName.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => ClientName.create('x'.repeat(CLIENT_CONSTRAINTS.NAME.MAX + 1))).toThrow(ClientError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => ClientName.create('')).toThrow()
    expect(() => ClientName.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => ClientName.create('a'.repeat(CLIENT_CONSTRAINTS.NAME.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = CLIENT_CONSTRAINTS.NAME.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: CLIENT_CONSTRAINTS.NAME.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(ClientName.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('ClientTaxId (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => ClientTaxId.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => ClientTaxId.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => ClientTaxId.create('x'.repeat(CLIENT_CONSTRAINTS.TAX_ID.MAX + 1))).toThrow(ClientError)
  })

  it('should throw for inner whitespace', () => {
    const min = 1
    expect(() => ClientTaxId.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = 1
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: CLIENT_CONSTRAINTS.TAX_ID.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(ClientTaxId.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('ClientEmail (email)', () => {
  it('should accept an empty string (optional field)', () => {
    expect(ClientEmail.create('').value).toBe('')
  })

  it('should throw for a non-email string', () => {
    expect(() => ClientEmail.create('not-an-email')).toThrow(ClientError)
  })

  it('should throw when longer than the max', () => {
    expect(() => ClientEmail.create(`${'a'.repeat(CLIENT_CONSTRAINTS.EMAIL.MAX)}@mail.com`)).toThrow(ClientError)
  })

  it('should accept and preserve valid emails', () => {
    fc.assert(
      fc.property(
        fc.emailAddress().filter(v => v.length <= CLIENT_CONSTRAINTS.EMAIL.MAX),
        value => {
          expect(ClientEmail.create(value).value).toBe(value)
        }
      ),
      { numRuns: 50 }
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
    const sample = '12345'
    expect(ClientTaxId.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '12345'
    expect(() => ClientTaxId.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
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
