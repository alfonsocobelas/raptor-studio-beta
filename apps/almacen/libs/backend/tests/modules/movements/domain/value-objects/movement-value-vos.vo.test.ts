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

describe.each([
  { name: 'MovementReference', Vo: MovementReference, max: MOVEMENT_CONSTRAINTS.REFERENCE.MAX },
  { name: 'MovementGarmentLabel', Vo: MovementGarmentLabel, max: MOVEMENT_CONSTRAINTS.GARMENT_LABEL.MAX },
  { name: 'MovementCounterparty', Vo: MovementCounterparty, max: MOVEMENT_CONSTRAINTS.COUNTERPARTY.MAX }
])('$name (optional text)', ({ Vo, max }) => {
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
})

describe('MovementReference — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(MovementReference.create('  12345  ').value).toBe('12345')
  })

  it('should throw for inner whitespace (code field)', () => {
    expect(() => MovementReference.create('12 345')).toThrow(InvalidArgumentError)
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
