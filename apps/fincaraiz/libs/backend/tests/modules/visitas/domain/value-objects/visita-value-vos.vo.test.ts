import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { VISITA_CONSTRAINTS } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/visita-constants'
import { VisitaError } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/visita-errors'
import { VisitaConfirmada } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/value-objects/visita-confirmada.vo'
import { VisitaInteresado } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/value-objects/visita-interesado.vo'
import { VisitaObservaciones } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/value-objects/visita-observaciones.vo'
import { VisitaReferencia } from '../../../../../src/contexts/fincaraiz/modules/visitas/domain/value-objects/visita-referencia.vo'

describe.each([
  { name: 'VisitaInteresado', Vo: VisitaInteresado, max: VISITA_CONSTRAINTS.INTERESADO.MAX },
  { name: 'VisitaObservaciones', Vo: VisitaObservaciones, max: VISITA_CONSTRAINTS.OBSERVACIONES.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(VisitaError)
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

describe('VisitaReferencia (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => VisitaReferencia.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => VisitaReferencia.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => VisitaReferencia.create('x'.repeat(VISITA_CONSTRAINTS.REFERENCIA.MAX + 1))).toThrow(VisitaError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => VisitaReferencia.create('')).toThrow()
    expect(() => VisitaReferencia.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => VisitaReferencia.create('a'.repeat(VISITA_CONSTRAINTS.REFERENCIA.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = VISITA_CONSTRAINTS.REFERENCIA.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: VISITA_CONSTRAINTS.REFERENCIA.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(VisitaReferencia.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('VisitaConfirmada', () => {
  it('should throw InvalidArgumentError for any non-boolean value', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.integer(), fc.object()), value => {
        expect(() => VisitaConfirmada.create(value as unknown as boolean)).toThrow(InvalidArgumentError)
      }),
      { numRuns: 100 }
    )
  })

  it('should create for true and false', () => {
    expect(VisitaConfirmada.create(true).value).toBe(true)
    expect(VisitaConfirmada.create(false).value).toBe(false)
  })

  it('equals should compare by value', () => {
    expect(VisitaConfirmada.create(true).equals(VisitaConfirmada.create(true))).toBe(true)
    expect(VisitaConfirmada.create(true).equals(VisitaConfirmada.create(false))).toBe(false)
  })
})

describe('VisitaReferencia — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(VisitaReferencia.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('VisitaInteresado — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(VisitaInteresado.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('VisitaObservaciones — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(VisitaObservaciones.create('  Sample text  ').value).toBe('Sample text')
  })
})
