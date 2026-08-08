import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { AGENTE_CONSTRAINTS } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/agente-constants'
import { AgenteError } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/agente-errors'
import { AgenteActivo } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-activo.vo'
import { AgenteComisionporcentaje } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-comisionporcentaje.vo'
import { AgenteEmail } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-email.vo'
import { AgenteNombre } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-nombre.vo'
import { AgenteTelefono } from '../../../../../src/contexts/fincaraiz/modules/agentes/domain/value-objects/agente-telefono.vo'

describe('AgenteComisionporcentaje', () => {
  it('should throw for a non-number', () => {
    expect(() => AgenteComisionporcentaje.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => AgenteComisionporcentaje.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: AGENTE_CONSTRAINTS.COMISIONPORCENTAJE.MIN - 1 }), value => {
        expect(() => AgenteComisionporcentaje.create(value)).toThrow(AgenteError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(AgenteComisionporcentaje.create(AGENTE_CONSTRAINTS.COMISIONPORCENTAJE.MIN).value).toBe(
      AGENTE_CONSTRAINTS.COMISIONPORCENTAJE.MIN
    )
    expect(AgenteComisionporcentaje.create(AGENTE_CONSTRAINTS.COMISIONPORCENTAJE.MIN + 100).value).toBe(
      AGENTE_CONSTRAINTS.COMISIONPORCENTAJE.MIN + 100
    )
  })
})

describe.each([
  { name: 'AgenteEmail', Vo: AgenteEmail, max: AGENTE_CONSTRAINTS.EMAIL.MAX },
  { name: 'AgenteTelefono', Vo: AgenteTelefono, max: AGENTE_CONSTRAINTS.TELEFONO.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(AgenteError)
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

describe('AgenteNombre (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => AgenteNombre.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => AgenteNombre.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => AgenteNombre.create('x'.repeat(AGENTE_CONSTRAINTS.NOMBRE.MAX + 1))).toThrow(AgenteError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => AgenteNombre.create('')).toThrow()
    expect(() => AgenteNombre.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => AgenteNombre.create('a'.repeat(AGENTE_CONSTRAINTS.NOMBRE.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = AGENTE_CONSTRAINTS.NOMBRE.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: AGENTE_CONSTRAINTS.NOMBRE.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(AgenteNombre.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('AgenteActivo', () => {
  it('should throw InvalidArgumentError for any non-boolean value', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.integer(), fc.object()), value => {
        expect(() => AgenteActivo.create(value as unknown as boolean)).toThrow(InvalidArgumentError)
      }),
      { numRuns: 100 }
    )
  })

  it('should create for true and false', () => {
    expect(AgenteActivo.create(true).value).toBe(true)
    expect(AgenteActivo.create(false).value).toBe(false)
  })

  it('equals should compare by value', () => {
    expect(AgenteActivo.create(true).equals(AgenteActivo.create(true))).toBe(true)
    expect(AgenteActivo.create(true).equals(AgenteActivo.create(false))).toBe(false)
  })
})

describe('AgenteNombre — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(AgenteNombre.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('AgenteEmail — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(AgenteEmail.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('AgenteTelefono — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(AgenteTelefono.create('  Sample text  ').value).toBe('Sample text')
  })
})
