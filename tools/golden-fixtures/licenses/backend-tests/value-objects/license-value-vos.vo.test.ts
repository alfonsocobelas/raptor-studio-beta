import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { LICENSE_CONSTRAINTS } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/license-constants'
import { LicenseError } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/license-errors'
import { AnnualValue } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/annual-value.vo'
import { LicensedUnits } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/licensed-units.vo'
import { MetricId } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/metric-id.vo'
import { MetricName } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/metric-name.vo'
import { PricePerUnit } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/price-per-unit.vo'
import { SubSolutionAreaName } from '../../../../../src/contexts/sap-licensing/modules/licenses/domain/value-objects/sub-solution-area-name.vo'

describe('LicensedUnits', () => {
  it('should throw for a non-number', () => {
    expect(() => LicensedUnits.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => LicensedUnits.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: LICENSE_CONSTRAINTS.LICENSED_UNITS.MIN - 1 }), value => {
        expect(() => LicensedUnits.create(value)).toThrow(LicenseError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(LicensedUnits.create(LICENSE_CONSTRAINTS.LICENSED_UNITS.MIN).value).toBe(
      LICENSE_CONSTRAINTS.LICENSED_UNITS.MIN
    )
    expect(LicensedUnits.create(LICENSE_CONSTRAINTS.LICENSED_UNITS.MIN + 100).value).toBe(
      LICENSE_CONSTRAINTS.LICENSED_UNITS.MIN + 100
    )
  })
})

describe('PricePerUnit', () => {
  it('should throw for a non-number', () => {
    expect(() => PricePerUnit.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => PricePerUnit.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: LICENSE_CONSTRAINTS.PRICE_PER_UNIT.MIN - 1 }), value => {
        expect(() => PricePerUnit.create(value)).toThrow(LicenseError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(PricePerUnit.create(LICENSE_CONSTRAINTS.PRICE_PER_UNIT.MIN).value).toBe(
      LICENSE_CONSTRAINTS.PRICE_PER_UNIT.MIN
    )
    expect(PricePerUnit.create(LICENSE_CONSTRAINTS.PRICE_PER_UNIT.MIN + 100).value).toBe(
      LICENSE_CONSTRAINTS.PRICE_PER_UNIT.MIN + 100
    )
  })
})

describe('AnnualValue', () => {
  it('should throw for a non-number', () => {
    expect(() => AnnualValue.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => AnnualValue.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: LICENSE_CONSTRAINTS.ANNUAL_VALUE.MIN - 1 }), value => {
        expect(() => AnnualValue.create(value)).toThrow(LicenseError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(AnnualValue.create(LICENSE_CONSTRAINTS.ANNUAL_VALUE.MIN).value).toBe(LICENSE_CONSTRAINTS.ANNUAL_VALUE.MIN)
    expect(AnnualValue.create(LICENSE_CONSTRAINTS.ANNUAL_VALUE.MIN + 100).value).toBe(
      LICENSE_CONSTRAINTS.ANNUAL_VALUE.MIN + 100
    )
  })
})

describe.each([
  { name: 'SubSolutionAreaName', Vo: SubSolutionAreaName, max: LICENSE_CONSTRAINTS.SUB_SOLUTION_AREA_NAME.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(LicenseError)
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

describe('MetricId (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => MetricId.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => MetricId.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => MetricId.create('x'.repeat(LICENSE_CONSTRAINTS.METRIC_ID.MAX + 1))).toThrow(LicenseError)
  })

  it('should throw for inner whitespace', () => {
    const min = 1
    expect(() => MetricId.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = 1
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: LICENSE_CONSTRAINTS.METRIC_ID.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(MetricId.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('MetricName (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => MetricName.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => MetricName.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => MetricName.create('x'.repeat(LICENSE_CONSTRAINTS.METRIC_NAME.MAX + 1))).toThrow(LicenseError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => MetricName.create('')).toThrow()
    expect(() => MetricName.create('   ')).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = 1
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: LICENSE_CONSTRAINTS.METRIC_NAME.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(MetricName.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('MetricId — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    const sample = '12345'
    expect(MetricId.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '12345'
    expect(() => MetricId.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
  })
})

describe('MetricName — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(MetricName.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('SubSolutionAreaName — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(SubSolutionAreaName.create('  Sample text  ').value).toBe('Sample text')
  })
})
