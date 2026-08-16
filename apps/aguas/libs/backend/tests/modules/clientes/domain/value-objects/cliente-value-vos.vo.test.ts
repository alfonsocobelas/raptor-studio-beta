import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { CLIENTE_CONSTRAINTS } from '../../../../../src/contexts/aguas/modules/clientes/domain/cliente-constants'
import { ClienteError } from '../../../../../src/contexts/aguas/modules/clientes/domain/cliente-errors'
import { ClienteLocalidad } from '../../../../../src/contexts/aguas/modules/clientes/domain/value-objects/cliente-localidad.vo'
import { ClienteNombre } from '../../../../../src/contexts/aguas/modules/clientes/domain/value-objects/cliente-nombre.vo'
import { ClienteTelefono } from '../../../../../src/contexts/aguas/modules/clientes/domain/value-objects/cliente-telefono.vo'

describe.each([
  { name: 'ClienteTelefono', Vo: ClienteTelefono, max: CLIENTE_CONSTRAINTS.TELEFONO.MAX },
  { name: 'ClienteLocalidad', Vo: ClienteLocalidad, max: CLIENTE_CONSTRAINTS.LOCALIDAD.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(ClienteError)
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

describe('ClienteNombre (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => ClienteNombre.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => ClienteNombre.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => ClienteNombre.create('x'.repeat(CLIENTE_CONSTRAINTS.NOMBRE.MAX + 1))).toThrow(ClienteError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => ClienteNombre.create('')).toThrow()
    expect(() => ClienteNombre.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => ClienteNombre.create('a'.repeat(CLIENTE_CONSTRAINTS.NOMBRE.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = CLIENTE_CONSTRAINTS.NOMBRE.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: CLIENTE_CONSTRAINTS.NOMBRE.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(ClienteNombre.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('ClienteNombre — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ClienteNombre.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ClienteTelefono — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ClienteTelefono.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ClienteLocalidad — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ClienteLocalidad.create('  Sample text  ').value).toBe('Sample text')
  })
})
