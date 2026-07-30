import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { SALE_CONSTRAINTS } from '../../../../../src/contexts/dealership/modules/sales/domain/sale-constants'
import { SaleError } from '../../../../../src/contexts/dealership/modules/sales/domain/sale-errors'
import { SaleAmount } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-amount.vo'
import { SaleClientLabel } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-client-label.vo'
import { SaleDiscount } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-discount.vo'
import { SaleReference } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-reference.vo'
import { SaleVehicleLabel } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-vehicle-label.vo'
import { Salesperson } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/salesperson.vo'

describe('SaleAmount', () => {
  it('should throw for a non-number', () => {
    expect(() => SaleAmount.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => SaleAmount.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: SALE_CONSTRAINTS.AMOUNT.MIN - 1 }), value => {
        expect(() => SaleAmount.create(value)).toThrow(SaleError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(SaleAmount.create(SALE_CONSTRAINTS.AMOUNT.MIN).value).toBe(SALE_CONSTRAINTS.AMOUNT.MIN)
    expect(SaleAmount.create(SALE_CONSTRAINTS.AMOUNT.MIN + 100).value).toBe(SALE_CONSTRAINTS.AMOUNT.MIN + 100)
  })
})

describe('SaleDiscount', () => {
  it('should throw for a non-number', () => {
    expect(() => SaleDiscount.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => SaleDiscount.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: SALE_CONSTRAINTS.DISCOUNT.MIN - 1 }), value => {
        expect(() => SaleDiscount.create(value)).toThrow(SaleError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(SaleDiscount.create(SALE_CONSTRAINTS.DISCOUNT.MIN).value).toBe(SALE_CONSTRAINTS.DISCOUNT.MIN)
    expect(SaleDiscount.create(SALE_CONSTRAINTS.DISCOUNT.MIN + 100).value).toBe(SALE_CONSTRAINTS.DISCOUNT.MIN + 100)
  })
})

describe.each([
  { name: 'SaleReference', Vo: SaleReference, max: SALE_CONSTRAINTS.REFERENCE.MAX },
  { name: 'SaleVehicleLabel', Vo: SaleVehicleLabel, max: SALE_CONSTRAINTS.VEHICLE_LABEL.MAX },
  { name: 'SaleClientLabel', Vo: SaleClientLabel, max: SALE_CONSTRAINTS.CLIENT_LABEL.MAX },
  { name: 'Salesperson', Vo: Salesperson, max: SALE_CONSTRAINTS.SALESPERSON.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(SaleError)
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

describe('SaleReference — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(SaleReference.create('  12345  ').value).toBe('12345')
  })

  it('should throw for inner whitespace (code field)', () => {
    expect(() => SaleReference.create('12 345')).toThrow(InvalidArgumentError)
  })
})

describe('SaleVehicleLabel — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(SaleVehicleLabel.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('SaleClientLabel — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(SaleClientLabel.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('Salesperson — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(Salesperson.create('  Sample text  ').value).toBe('Sample text')
  })
})
