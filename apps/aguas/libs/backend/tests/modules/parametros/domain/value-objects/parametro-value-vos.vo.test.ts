import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { PARAMETRO_CONSTRAINTS } from '../../../../../src/contexts/aguas/modules/parametros/domain/parametro-constants'
import { ParametroError } from '../../../../../src/contexts/aguas/modules/parametros/domain/parametro-errors'
import { ParametroCodigo } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-codigo.vo'
import { ParametroLimitelegal } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-limitelegal.vo'
import { ParametroMetodo } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-metodo.vo'
import { ParametroNombre } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-nombre.vo'
import { ParametroPrecio } from '../../../../../src/contexts/aguas/modules/parametros/domain/value-objects/parametro-precio.vo'

describe('ParametroLimitelegal', () => {
  it('should throw for a non-number', () => {
    expect(() => ParametroLimitelegal.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => ParametroLimitelegal.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: PARAMETRO_CONSTRAINTS.LIMITELEGAL.MIN - 1 }), value => {
        expect(() => ParametroLimitelegal.create(value)).toThrow(ParametroError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(ParametroLimitelegal.create(PARAMETRO_CONSTRAINTS.LIMITELEGAL.MIN).value).toBe(
      PARAMETRO_CONSTRAINTS.LIMITELEGAL.MIN
    )
    expect(ParametroLimitelegal.create(PARAMETRO_CONSTRAINTS.LIMITELEGAL.MIN + 100).value).toBe(
      PARAMETRO_CONSTRAINTS.LIMITELEGAL.MIN + 100
    )
  })
})

describe('ParametroPrecio', () => {
  it('should throw for a non-number', () => {
    expect(() => ParametroPrecio.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => ParametroPrecio.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: PARAMETRO_CONSTRAINTS.PRECIO.MIN - 1 }), value => {
        expect(() => ParametroPrecio.create(value)).toThrow(ParametroError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(ParametroPrecio.create(PARAMETRO_CONSTRAINTS.PRECIO.MIN).value).toBe(PARAMETRO_CONSTRAINTS.PRECIO.MIN)
    expect(ParametroPrecio.create(PARAMETRO_CONSTRAINTS.PRECIO.MIN + 100).value).toBe(
      PARAMETRO_CONSTRAINTS.PRECIO.MIN + 100
    )
  })
})

describe.each([
  { name: 'ParametroNombre', Vo: ParametroNombre, max: PARAMETRO_CONSTRAINTS.NOMBRE.MAX },
  { name: 'ParametroMetodo', Vo: ParametroMetodo, max: PARAMETRO_CONSTRAINTS.METODO.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(ParametroError)
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

describe('ParametroCodigo (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => ParametroCodigo.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => ParametroCodigo.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => ParametroCodigo.create('x'.repeat(PARAMETRO_CONSTRAINTS.CODIGO.MAX + 1))).toThrow(ParametroError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => ParametroCodigo.create('')).toThrow()
    expect(() => ParametroCodigo.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => ParametroCodigo.create('a'.repeat(PARAMETRO_CONSTRAINTS.CODIGO.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = PARAMETRO_CONSTRAINTS.CODIGO.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: PARAMETRO_CONSTRAINTS.CODIGO.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(ParametroCodigo.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('ParametroCodigo — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ParametroCodigo.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ParametroNombre — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ParametroNombre.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ParametroMetodo — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ParametroMetodo.create('  Sample text  ').value).toBe('Sample text')
  })
})
