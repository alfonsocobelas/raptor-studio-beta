import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { MUESTRA_CONSTRAINTS } from '../../../../../src/contexts/aguas/modules/muestras/domain/muestra-constants'
import { MuestraError } from '../../../../../src/contexts/aguas/modules/muestras/domain/muestra-errors'
import { MuestraCodigo } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-codigo.vo'
import { MuestraImporte } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-importe.vo'
import { MuestraTecnico } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-tecnico.vo'

describe('MuestraImporte', () => {
  it('should throw for a non-number', () => {
    expect(() => MuestraImporte.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => MuestraImporte.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: MUESTRA_CONSTRAINTS.IMPORTE.MIN - 1 }), value => {
        expect(() => MuestraImporte.create(value)).toThrow(MuestraError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(MuestraImporte.create(MUESTRA_CONSTRAINTS.IMPORTE.MIN).value).toBe(MUESTRA_CONSTRAINTS.IMPORTE.MIN)
    expect(MuestraImporte.create(MUESTRA_CONSTRAINTS.IMPORTE.MIN + 100).value).toBe(
      MUESTRA_CONSTRAINTS.IMPORTE.MIN + 100
    )
  })
})

describe.each([{ name: 'MuestraTecnico', Vo: MuestraTecnico, max: MUESTRA_CONSTRAINTS.TECNICO.MAX }])(
  '$name (optional text)',
  ({ Vo, max }) => {
    it('should accept an empty string', () => {
      expect(Vo.create('').value).toBe('')
    })

    it('should throw for null/undefined', () => {
      expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw when longer than the max', () => {
      expect(() => Vo.create('x'.repeat(max + 1))).toThrow(MuestraError)
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

describe('MuestraCodigo (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => MuestraCodigo.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => MuestraCodigo.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => MuestraCodigo.create('x'.repeat(MUESTRA_CONSTRAINTS.CODIGO.MAX + 1))).toThrow(MuestraError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => MuestraCodigo.create('')).toThrow()
    expect(() => MuestraCodigo.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => MuestraCodigo.create('a'.repeat(MUESTRA_CONSTRAINTS.CODIGO.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = MUESTRA_CONSTRAINTS.CODIGO.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: MUESTRA_CONSTRAINTS.CODIGO.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(MuestraCodigo.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('MuestraCodigo — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(MuestraCodigo.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('MuestraTecnico — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(MuestraTecnico.create('  Sample text  ').value).toBe('Sample text')
  })
})
