import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { GARMENT_CONSTRAINTS } from '../../../../../src/contexts/warehouse/modules/garments/domain/garment-constants'
import { GarmentError } from '../../../../../src/contexts/warehouse/modules/garments/domain/garment-errors'
import { GarmentBrand } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-brand.vo'
import { GarmentColor } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-color.vo'
import { GarmentName } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-name.vo'
import { GarmentPrice } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/garment-price.vo'
import { Sku } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/sku.vo'
import { StockUnits } from '../../../../../src/contexts/warehouse/modules/garments/domain/value-objects/stock-units.vo'

describe('GarmentPrice', () => {
  it('should throw for a non-number', () => {
    expect(() => GarmentPrice.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => GarmentPrice.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: GARMENT_CONSTRAINTS.PRICE.MIN - 1 }), value => {
        expect(() => GarmentPrice.create(value)).toThrow(GarmentError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(GarmentPrice.create(GARMENT_CONSTRAINTS.PRICE.MIN).value).toBe(GARMENT_CONSTRAINTS.PRICE.MIN)
    expect(GarmentPrice.create(GARMENT_CONSTRAINTS.PRICE.MIN + 100).value).toBe(GARMENT_CONSTRAINTS.PRICE.MIN + 100)
  })
})

describe('StockUnits', () => {
  it('should throw for a non-number', () => {
    expect(() => StockUnits.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => StockUnits.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: GARMENT_CONSTRAINTS.STOCK.MIN - 1 }), value => {
        expect(() => StockUnits.create(value)).toThrow(GarmentError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(StockUnits.create(GARMENT_CONSTRAINTS.STOCK.MIN).value).toBe(GARMENT_CONSTRAINTS.STOCK.MIN)
    expect(StockUnits.create(GARMENT_CONSTRAINTS.STOCK.MIN + 100).value).toBe(GARMENT_CONSTRAINTS.STOCK.MIN + 100)
  })
})

describe.each([
  { name: 'GarmentBrand', Vo: GarmentBrand, max: GARMENT_CONSTRAINTS.BRAND.MAX },
  { name: 'GarmentColor', Vo: GarmentColor, max: GARMENT_CONSTRAINTS.COLOR.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(GarmentError)
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

describe('Sku (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => Sku.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => Sku.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Sku.create('x'.repeat(GARMENT_CONSTRAINTS.SKU.MAX + 1))).toThrow(GarmentError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => Sku.create('')).toThrow()
    expect(() => Sku.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => Sku.create('a'.repeat(GARMENT_CONSTRAINTS.SKU.MIN - 1))).toThrow()
  })

  it('should throw for inner whitespace', () => {
    const min = GARMENT_CONSTRAINTS.SKU.MIN
    expect(() => Sku.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = GARMENT_CONSTRAINTS.SKU.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: GARMENT_CONSTRAINTS.SKU.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(Sku.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('GarmentName (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => GarmentName.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => GarmentName.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => GarmentName.create('x'.repeat(GARMENT_CONSTRAINTS.NAME.MAX + 1))).toThrow(GarmentError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => GarmentName.create('')).toThrow()
    expect(() => GarmentName.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => GarmentName.create('a'.repeat(GARMENT_CONSTRAINTS.NAME.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = GARMENT_CONSTRAINTS.NAME.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: GARMENT_CONSTRAINTS.NAME.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(GarmentName.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Sku — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    const sample = '1'.repeat(GARMENT_CONSTRAINTS.SKU.MIN)
    expect(Sku.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '1'.repeat(GARMENT_CONSTRAINTS.SKU.MIN)
    expect(() => Sku.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
  })
})

describe('GarmentName — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(GarmentName.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('GarmentBrand — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(GarmentBrand.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('GarmentColor — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(GarmentColor.create('  Sample text  ').value).toBe('Sample text')
  })
})
