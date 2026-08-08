import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { PROPIEDAD_CONSTRAINTS } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/propiedad-constants'
import { PropiedadError } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/propiedad-errors'
import { PropiedadExclusiva } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-exclusiva.vo'
import { PropiedadHabitaciones } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-habitaciones.vo'
import { PropiedadMetroscuadrados } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-metroscuadrados.vo'
import { PropiedadPrecio } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-precio.vo'
import { PropiedadTitulo } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-titulo.vo'
import { PropiedadZona } from '../../../../../src/contexts/fincaraiz/modules/propiedades/domain/value-objects/propiedad-zona.vo'

describe('PropiedadMetroscuadrados', () => {
  it('should throw for a non-number', () => {
    expect(() => PropiedadMetroscuadrados.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => PropiedadMetroscuadrados.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: PROPIEDAD_CONSTRAINTS.METROSCUADRADOS.MIN - 1 }), value => {
        expect(() => PropiedadMetroscuadrados.create(value)).toThrow(PropiedadError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(PropiedadMetroscuadrados.create(PROPIEDAD_CONSTRAINTS.METROSCUADRADOS.MIN).value).toBe(
      PROPIEDAD_CONSTRAINTS.METROSCUADRADOS.MIN
    )
    expect(PropiedadMetroscuadrados.create(PROPIEDAD_CONSTRAINTS.METROSCUADRADOS.MIN + 100).value).toBe(
      PROPIEDAD_CONSTRAINTS.METROSCUADRADOS.MIN + 100
    )
  })
})

describe('PropiedadHabitaciones', () => {
  it('should throw for a non-number', () => {
    expect(() => PropiedadHabitaciones.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => PropiedadHabitaciones.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: PROPIEDAD_CONSTRAINTS.HABITACIONES.MIN - 1 }), value => {
        expect(() => PropiedadHabitaciones.create(value)).toThrow(PropiedadError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(PropiedadHabitaciones.create(PROPIEDAD_CONSTRAINTS.HABITACIONES.MIN).value).toBe(
      PROPIEDAD_CONSTRAINTS.HABITACIONES.MIN
    )
    expect(PropiedadHabitaciones.create(PROPIEDAD_CONSTRAINTS.HABITACIONES.MIN + 100).value).toBe(
      PROPIEDAD_CONSTRAINTS.HABITACIONES.MIN + 100
    )
  })
})

describe('PropiedadPrecio', () => {
  it('should throw for a non-number', () => {
    expect(() => PropiedadPrecio.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => PropiedadPrecio.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: PROPIEDAD_CONSTRAINTS.PRECIO.MIN - 1 }), value => {
        expect(() => PropiedadPrecio.create(value)).toThrow(PropiedadError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(PropiedadPrecio.create(PROPIEDAD_CONSTRAINTS.PRECIO.MIN).value).toBe(PROPIEDAD_CONSTRAINTS.PRECIO.MIN)
    expect(PropiedadPrecio.create(PROPIEDAD_CONSTRAINTS.PRECIO.MIN + 100).value).toBe(
      PROPIEDAD_CONSTRAINTS.PRECIO.MIN + 100
    )
  })
})

describe.each([{ name: 'PropiedadZona', Vo: PropiedadZona, max: PROPIEDAD_CONSTRAINTS.ZONA.MAX }])(
  '$name (optional text)',
  ({ Vo, max }) => {
    it('should accept an empty string', () => {
      expect(Vo.create('').value).toBe('')
    })

    it('should throw for null/undefined', () => {
      expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw when longer than the max', () => {
      expect(() => Vo.create('x'.repeat(max + 1))).toThrow(PropiedadError)
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
  }
)

describe('PropiedadTitulo (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => PropiedadTitulo.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => PropiedadTitulo.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => PropiedadTitulo.create('x'.repeat(PROPIEDAD_CONSTRAINTS.TITULO.MAX + 1))).toThrow(PropiedadError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => PropiedadTitulo.create('')).toThrow()
    expect(() => PropiedadTitulo.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => PropiedadTitulo.create('a'.repeat(PROPIEDAD_CONSTRAINTS.TITULO.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = PROPIEDAD_CONSTRAINTS.TITULO.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: PROPIEDAD_CONSTRAINTS.TITULO.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(PropiedadTitulo.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('PropiedadExclusiva', () => {
  it('should throw InvalidArgumentError for any non-boolean value', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.integer(), fc.object()), value => {
        expect(() => PropiedadExclusiva.create(value as unknown as boolean)).toThrow(InvalidArgumentError)
      }),
      { numRuns: 100 }
    )
  })

  it('should create for true and false', () => {
    expect(PropiedadExclusiva.create(true).value).toBe(true)
    expect(PropiedadExclusiva.create(false).value).toBe(false)
  })

  it('equals should compare by value', () => {
    expect(PropiedadExclusiva.create(true).equals(PropiedadExclusiva.create(true))).toBe(true)
    expect(PropiedadExclusiva.create(true).equals(PropiedadExclusiva.create(false))).toBe(false)
  })
})

describe('PropiedadTitulo — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(PropiedadTitulo.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('PropiedadZona — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(PropiedadZona.create('  Sample text  ').value).toBe('Sample text')
  })
})
