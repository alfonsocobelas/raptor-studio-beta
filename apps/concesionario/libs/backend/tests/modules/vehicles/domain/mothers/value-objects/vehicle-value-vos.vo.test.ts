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
  { name: 'Vin', Vo: Vin, max: VEHICLE_CONSTRAINTS.VIN.MAX },
  { name: 'VehicleBrand', Vo: VehicleBrand, max: VEHICLE_CONSTRAINTS.BRAND.MAX },
  { name: 'VehicleModel', Vo: VehicleModel, max: VEHICLE_CONSTRAINTS.MODEL.MAX },
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

describe('Vin — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    expect(Vin.create('  12345  ').value).toBe('12345')
  })

  it('should throw for inner whitespace (code field)', () => {
    expect(() => Vin.create('12 345')).toThrow(InvalidArgumentError)
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
