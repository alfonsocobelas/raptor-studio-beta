import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { ValueObject } from '../../../../../src/contexts/shared/domain/value-objects/value-object'
import { MuestraEstado } from '../../../../../src/contexts/aguas/modules/muestras/domain/value-objects/muestra-estado.vo'

type EnumVoFactory = { create(value: string): ValueObject<string>; VALUES: readonly string[] }

const enumVos: { name: string; Vo: EnumVoFactory; values: readonly string[] }[] = [
  {
    name: 'MuestraEstado',
    Vo: MuestraEstado,
    values: ['recibida', 'en_analisis', 'fuera_de_rango', 'validada', 'informada', 'facturada']
  }
]

describe.each(enumVos)('$name', ({ Vo, values }) => {
  describe('create', () => {
    it('should accept every allowed value and preserve it', () => {
      for (const value of values) {
        expect(Vo.create(value).value).toBe(value)
      }
    })

    it('should expose the allowed values in VALUES', () => {
      expect([...Vo.VALUES]).toEqual([...values])
    })

    it('should throw InvalidArgumentError for empty string', () => {
      expect(() => Vo.create('')).toThrow(InvalidArgumentError)
    })

    it('should throw InvalidArgumentError for any value outside the allowed set', () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter(v => v.trim().length > 0 && !(values as readonly string[]).includes(v)),
          value => {
            expect(() => Vo.create(value)).toThrow(InvalidArgumentError)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('equals', () => {
    it('should return true for the same value', () => {
      expect(Vo.create(values[0]).equals(Vo.create(values[0]))).toBe(true)
    })

    it('should return false for different values', () => {
      expect(Vo.create(values[0]).equals(Vo.create(values[1]))).toBe(false)
    })
  })
})
