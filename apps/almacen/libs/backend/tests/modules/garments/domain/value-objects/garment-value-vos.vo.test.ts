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
  { name: 'Sku', Vo: Sku, max: GARMENT_CONSTRAINTS.SKU.MAX },
  { name: 'GarmentName', Vo: GarmentName, max: GARMENT_CONSTRAINTS.NAME.MAX },
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

describe('Sku — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(Sku.create('  12345  ').value).toBe('12345')
  })

  it('should throw for inner whitespace (code field)', () => {
    expect(() => Sku.create('12 345')).toThrow(InvalidArgumentError)
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
