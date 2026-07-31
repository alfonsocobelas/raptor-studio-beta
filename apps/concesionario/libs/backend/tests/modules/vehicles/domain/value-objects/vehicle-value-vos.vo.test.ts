import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { VEHICLE_CONSTRAINTS } from '../../../../../src/contexts/dealership/modules/vehicles/domain/vehicle-constants'
import { VehicleError } from '../../../../../src/contexts/dealership/modules/vehicles/domain/vehicle-errors'
import { Mileage } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/mileage.vo'
import { Plate } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/plate.vo'
import { Price } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/price.vo'
import { VehicleBrand } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-brand.vo'
import { VehicleColor } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-color.vo'
import { VehicleModel } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-model.vo'
import { VehicleNotes } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-notes.vo'
import { VehicleVersion } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-version.vo'
import { VehicleYear } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vehicle-year.vo'
import { Vin } from '../../../../../src/contexts/dealership/modules/vehicles/domain/value-objects/vin.vo'

describe('VehicleYear', () => {
  it('should throw for a non-number', () => {
    expect(() => VehicleYear.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => VehicleYear.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: VEHICLE_CONSTRAINTS.YEAR.MIN - 1 }), value => {
        expect(() => VehicleYear.create(value)).toThrow(VehicleError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(VehicleYear.create(VEHICLE_CONSTRAINTS.YEAR.MIN).value).toBe(VEHICLE_CONSTRAINTS.YEAR.MIN)
    expect(VehicleYear.create(VEHICLE_CONSTRAINTS.YEAR.MIN + 100).value).toBe(VEHICLE_CONSTRAINTS.YEAR.MIN + 100)
  })
})

describe('Mileage', () => {
  it('should throw for a non-number', () => {
    expect(() => Mileage.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => Mileage.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: VEHICLE_CONSTRAINTS.MILEAGE.MIN - 1 }), value => {
        expect(() => Mileage.create(value)).toThrow(VehicleError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(Mileage.create(VEHICLE_CONSTRAINTS.MILEAGE.MIN).value).toBe(VEHICLE_CONSTRAINTS.MILEAGE.MIN)
    expect(Mileage.create(VEHICLE_CONSTRAINTS.MILEAGE.MIN + 100).value).toBe(VEHICLE_CONSTRAINTS.MILEAGE.MIN + 100)
  })
})

describe('Price', () => {
  it('should throw for a non-number', () => {
    expect(() => Price.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => Price.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: VEHICLE_CONSTRAINTS.PRICE.MIN - 1 }), value => {
        expect(() => Price.create(value)).toThrow(VehicleError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(Price.create(VEHICLE_CONSTRAINTS.PRICE.MIN).value).toBe(VEHICLE_CONSTRAINTS.PRICE.MIN)
    expect(Price.create(VEHICLE_CONSTRAINTS.PRICE.MIN + 100).value).toBe(VEHICLE_CONSTRAINTS.PRICE.MIN + 100)
  })
})

describe.each([
  { name: 'VehicleVersion', Vo: VehicleVersion, max: VEHICLE_CONSTRAINTS.VERSION.MAX },
  { name: 'Plate', Vo: Plate, max: VEHICLE_CONSTRAINTS.PLATE.MAX },
  { name: 'VehicleColor', Vo: VehicleColor, max: VEHICLE_CONSTRAINTS.COLOR.MAX },
  { name: 'VehicleNotes', Vo: VehicleNotes, max: VEHICLE_CONSTRAINTS.NOTES.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(VehicleError)
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

describe('Vin (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => Vin.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => Vin.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vin.create('x'.repeat(VEHICLE_CONSTRAINTS.VIN.MAX + 1))).toThrow(VehicleError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => Vin.create('')).toThrow()
    expect(() => Vin.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => Vin.create('a'.repeat(VEHICLE_CONSTRAINTS.VIN.MIN - 1))).toThrow()
  })

  it('should throw for inner whitespace', () => {
    const min = VEHICLE_CONSTRAINTS.VIN.MIN
    expect(() => Vin.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = VEHICLE_CONSTRAINTS.VIN.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: VEHICLE_CONSTRAINTS.VIN.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(Vin.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('VehicleBrand (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => VehicleBrand.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => VehicleBrand.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => VehicleBrand.create('x'.repeat(VEHICLE_CONSTRAINTS.BRAND.MAX + 1))).toThrow(VehicleError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => VehicleBrand.create('')).toThrow()
    expect(() => VehicleBrand.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => VehicleBrand.create('a'.repeat(VEHICLE_CONSTRAINTS.BRAND.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = VEHICLE_CONSTRAINTS.BRAND.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: VEHICLE_CONSTRAINTS.BRAND.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(VehicleBrand.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('VehicleModel (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => VehicleModel.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => VehicleModel.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => VehicleModel.create('x'.repeat(VEHICLE_CONSTRAINTS.MODEL.MAX + 1))).toThrow(VehicleError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => VehicleModel.create('')).toThrow()
    expect(() => VehicleModel.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => VehicleModel.create('a'.repeat(VEHICLE_CONSTRAINTS.MODEL.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = VEHICLE_CONSTRAINTS.MODEL.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: VEHICLE_CONSTRAINTS.MODEL.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(VehicleModel.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('Vin — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    const sample = '1'.repeat(VEHICLE_CONSTRAINTS.VIN.MIN)
    expect(Vin.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '1'.repeat(VEHICLE_CONSTRAINTS.VIN.MIN)
    expect(() => Vin.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
  })
})

describe('VehicleBrand — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(VehicleBrand.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('VehicleModel — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(VehicleModel.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('VehicleVersion — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(VehicleVersion.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('Plate — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(Plate.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('VehicleColor — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(VehicleColor.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('VehicleNotes — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(VehicleNotes.create('  Sample text  ').value).toBe('Sample text')
  })
})
