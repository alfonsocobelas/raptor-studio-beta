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

describe.each([{ name: 'Salesperson', Vo: Salesperson, max: SALE_CONSTRAINTS.SALESPERSON.MAX }])(
  '$name (optional text)',
  ({ Vo, max }) => {
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
  }
)

describe('SaleReference (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => SaleReference.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => SaleReference.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => SaleReference.create('x'.repeat(SALE_CONSTRAINTS.REFERENCE.MAX + 1))).toThrow(SaleError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => SaleReference.create('')).toThrow()
    expect(() => SaleReference.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => SaleReference.create('a'.repeat(SALE_CONSTRAINTS.REFERENCE.MIN - 1))).toThrow()
  })

  it('should throw for inner whitespace', () => {
    const min = SALE_CONSTRAINTS.REFERENCE.MIN
    expect(() => SaleReference.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = SALE_CONSTRAINTS.REFERENCE.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: SALE_CONSTRAINTS.REFERENCE.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(SaleReference.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('SaleVehicleLabel (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => SaleVehicleLabel.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => SaleVehicleLabel.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => SaleVehicleLabel.create('x'.repeat(SALE_CONSTRAINTS.VEHICLE_LABEL.MAX + 1))).toThrow(SaleError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => SaleVehicleLabel.create('')).toThrow()
    expect(() => SaleVehicleLabel.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => SaleVehicleLabel.create('a'.repeat(SALE_CONSTRAINTS.VEHICLE_LABEL.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = SALE_CONSTRAINTS.VEHICLE_LABEL.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: SALE_CONSTRAINTS.VEHICLE_LABEL.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(SaleVehicleLabel.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('SaleClientLabel (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => SaleClientLabel.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => SaleClientLabel.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => SaleClientLabel.create('x'.repeat(SALE_CONSTRAINTS.CLIENT_LABEL.MAX + 1))).toThrow(SaleError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => SaleClientLabel.create('')).toThrow()
    expect(() => SaleClientLabel.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => SaleClientLabel.create('a'.repeat(SALE_CONSTRAINTS.CLIENT_LABEL.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = SALE_CONSTRAINTS.CLIENT_LABEL.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: SALE_CONSTRAINTS.CLIENT_LABEL.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(SaleClientLabel.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('SaleReference — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    const sample = '1'.repeat(SALE_CONSTRAINTS.REFERENCE.MIN)
    expect(SaleReference.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '1'.repeat(SALE_CONSTRAINTS.REFERENCE.MIN)
    expect(() => SaleReference.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
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
