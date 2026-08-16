import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { PUNTO_CONSTRAINTS } from '../../../../../src/contexts/aguas/modules/puntos/domain/punto-constants'
import { PuntoError } from '../../../../../src/contexts/aguas/modules/puntos/domain/punto-errors'
import { PuntoCoordenadas } from '../../../../../src/contexts/aguas/modules/puntos/domain/value-objects/punto-coordenadas.vo'
import { PuntoDireccion } from '../../../../../src/contexts/aguas/modules/puntos/domain/value-objects/punto-direccion.vo'
import { PuntoNombre } from '../../../../../src/contexts/aguas/modules/puntos/domain/value-objects/punto-nombre.vo'
import { PuntoObligatorio } from '../../../../../src/contexts/aguas/modules/puntos/domain/value-objects/punto-obligatorio.vo'

describe.each([
  { name: 'PuntoDireccion', Vo: PuntoDireccion, max: PUNTO_CONSTRAINTS.DIRECCION.MAX },
  { name: 'PuntoCoordenadas', Vo: PuntoCoordenadas, max: PUNTO_CONSTRAINTS.COORDENADAS.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(PuntoError)
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

describe('PuntoNombre (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => PuntoNombre.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => PuntoNombre.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => PuntoNombre.create('x'.repeat(PUNTO_CONSTRAINTS.NOMBRE.MAX + 1))).toThrow(PuntoError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => PuntoNombre.create('')).toThrow()
    expect(() => PuntoNombre.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => PuntoNombre.create('a'.repeat(PUNTO_CONSTRAINTS.NOMBRE.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = PUNTO_CONSTRAINTS.NOMBRE.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: PUNTO_CONSTRAINTS.NOMBRE.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(PuntoNombre.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('PuntoObligatorio', () => {
  it('should throw InvalidArgumentError for any non-boolean value', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.integer(), fc.object()), value => {
        expect(() => PuntoObligatorio.create(value as unknown as boolean)).toThrow(InvalidArgumentError)
      }),
      { numRuns: 100 }
    )
  })

  it('should create for true and false', () => {
    expect(PuntoObligatorio.create(true).value).toBe(true)
    expect(PuntoObligatorio.create(false).value).toBe(false)
  })

  it('equals should compare by value', () => {
    expect(PuntoObligatorio.create(true).equals(PuntoObligatorio.create(true))).toBe(true)
    expect(PuntoObligatorio.create(true).equals(PuntoObligatorio.create(false))).toBe(false)
  })
})

describe('PuntoNombre — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(PuntoNombre.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('PuntoDireccion — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(PuntoDireccion.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('PuntoCoordenadas — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(PuntoCoordenadas.create('  Sample text  ').value).toBe('Sample text')
  })
})
