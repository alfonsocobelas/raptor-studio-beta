import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { MOVEMENT_CONSTRAINTS } from '../../../../../src/contexts/warehouse/modules/movements/domain/movement-constants'
import { MovementError } from '../../../../../src/contexts/warehouse/modules/movements/domain/movement-errors'
import { MovementCounterparty } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-counterparty.vo'
import { MovementGarmentLabel } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-garment-label.vo'
import { MovementQuantity } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-quantity.vo'
import { MovementReference } from '../../../../../src/contexts/warehouse/modules/movements/domain/value-objects/movement-reference.vo'

describe('MovementQuantity', () => {
  it('should throw for a non-number', () => {
    expect(() => MovementQuantity.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => MovementQuantity.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: MOVEMENT_CONSTRAINTS.QUANTITY.MIN - 1 }), value => {
        expect(() => MovementQuantity.create(value)).toThrow(MovementError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(MovementQuantity.create(MOVEMENT_CONSTRAINTS.QUANTITY.MIN).value).toBe(MOVEMENT_CONSTRAINTS.QUANTITY.MIN)
    expect(MovementQuantity.create(MOVEMENT_CONSTRAINTS.QUANTITY.MIN + 100).value).toBe(
      MOVEMENT_CONSTRAINTS.QUANTITY.MIN + 100
    )
  })
})

describe.each([{ name: 'MovementCounterparty', Vo: MovementCounterparty, max: MOVEMENT_CONSTRAINTS.COUNTERPARTY.MAX }])(
  '$name (optional text)',
  ({ Vo, max }) => {
    it('should accept an empty string', () => {
      expect(Vo.create('').value).toBe('')
    })

    it('should throw for null/undefined', () => {
      expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw when longer than the max', () => {
      expect(() => Vo.create('x'.repeat(max + 1))).toThrow(MovementError)
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

describe('MovementReference (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => MovementReference.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => MovementReference.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => MovementReference.create('x'.repeat(MOVEMENT_CONSTRAINTS.REFERENCE.MAX + 1))).toThrow(MovementError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => MovementReference.create('')).toThrow()
    expect(() => MovementReference.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => MovementReference.create('a'.repeat(MOVEMENT_CONSTRAINTS.REFERENCE.MIN - 1))).toThrow()
  })

  it('should throw for inner whitespace', () => {
    const min = MOVEMENT_CONSTRAINTS.REFERENCE.MIN
    expect(() => MovementReference.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = MOVEMENT_CONSTRAINTS.REFERENCE.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: MOVEMENT_CONSTRAINTS.REFERENCE.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(MovementReference.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('MovementGarmentLabel (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => MovementGarmentLabel.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => MovementGarmentLabel.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => MovementGarmentLabel.create('x'.repeat(MOVEMENT_CONSTRAINTS.GARMENT_LABEL.MAX + 1))).toThrow(
      MovementError
    )
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => MovementGarmentLabel.create('')).toThrow()
    expect(() => MovementGarmentLabel.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => MovementGarmentLabel.create('a'.repeat(MOVEMENT_CONSTRAINTS.GARMENT_LABEL.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = MOVEMENT_CONSTRAINTS.GARMENT_LABEL.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: MOVEMENT_CONSTRAINTS.GARMENT_LABEL.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(MovementGarmentLabel.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('MovementReference — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    const sample = '1'.repeat(MOVEMENT_CONSTRAINTS.REFERENCE.MIN)
    expect(MovementReference.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '1'.repeat(MOVEMENT_CONSTRAINTS.REFERENCE.MIN)
    expect(() => MovementReference.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
  })
})

describe('MovementGarmentLabel — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(MovementGarmentLabel.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('MovementCounterparty — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(MovementCounterparty.create('  Sample text  ').value).toBe('Sample text')
  })
})
