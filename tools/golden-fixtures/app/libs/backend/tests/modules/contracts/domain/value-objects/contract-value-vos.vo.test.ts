import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { CONTRACT_CONSTRAINTS } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/contract-constants'
import { ContractError } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/contract-errors'
import { BusinessModel } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/business-model.vo'
import { CmsCaseId } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/cms-case-id.vo'
import { ContractCurrency } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-currency.vo'
import { ContractNotes } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-notes.vo'
import { ContractValue } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/contract-value.vo'
import { IsFavorite } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/is-favorite.vo'
import { NumberOfContracts } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/number-of-contracts.vo'
import { SubSolutionAreas } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/sub-solution-areas.vo'
import { SupportModel } from '../../../../../src/contexts/sap-licensing/modules/contracts/domain/value-objects/support-model.vo'

describe('NumberOfContracts', () => {
  it('should throw for a non-number', () => {
    expect(() => NumberOfContracts.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => NumberOfContracts.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: CONTRACT_CONSTRAINTS.NBR_OF_CONTRACTS.MIN - 1 }), value => {
        expect(() => NumberOfContracts.create(value)).toThrow(ContractError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(NumberOfContracts.create(CONTRACT_CONSTRAINTS.NBR_OF_CONTRACTS.MIN).value).toBe(
      CONTRACT_CONSTRAINTS.NBR_OF_CONTRACTS.MIN
    )
    expect(NumberOfContracts.create(CONTRACT_CONSTRAINTS.NBR_OF_CONTRACTS.MIN + 100).value).toBe(
      CONTRACT_CONSTRAINTS.NBR_OF_CONTRACTS.MIN + 100
    )
  })
})

describe('ContractValue', () => {
  it('should throw for a non-number', () => {
    expect(() => ContractValue.create(NaN)).toThrow(InvalidArgumentError)
    expect(() => ContractValue.create('10' as unknown as number)).toThrow(InvalidArgumentError)
  })

  it('should throw below the minimum', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1_000_000, max: CONTRACT_CONSTRAINTS.TOTAL_VALUE.MIN - 1 }), value => {
        expect(() => ContractValue.create(value)).toThrow(ContractError)
      })
    )
  })

  it('should accept the minimum and above', () => {
    expect(ContractValue.create(CONTRACT_CONSTRAINTS.TOTAL_VALUE.MIN).value).toBe(CONTRACT_CONSTRAINTS.TOTAL_VALUE.MIN)
    expect(ContractValue.create(CONTRACT_CONSTRAINTS.TOTAL_VALUE.MIN + 100).value).toBe(
      CONTRACT_CONSTRAINTS.TOTAL_VALUE.MIN + 100
    )
  })

  it('unset() should return null', () => {
    expect(ContractValue.unset()).toBeNull()
  })
})

describe('ContractCurrency', () => {
  it('should throw for empty string', () => {
    expect(() => ContractCurrency.create('')).toThrow(InvalidArgumentError)
  })

  it('should throw when not exactly the required length', () => {
    expect(() => ContractCurrency.create('A'.repeat(CONTRACT_CONSTRAINTS.CURRENCY.LENGTH - 1))).toThrow(ContractError)
    expect(() => ContractCurrency.create('A'.repeat(CONTRACT_CONSTRAINTS.CURRENCY.LENGTH + 1))).toThrow(ContractError)
  })

  it('should preserve a valid value', () => {
    const valid = 'A'.repeat(CONTRACT_CONSTRAINTS.CURRENCY.LENGTH)
    expect(ContractCurrency.create(valid).value).toBe(valid)
  })
})

describe.each([
  { name: 'BusinessModel', Vo: BusinessModel, max: CONTRACT_CONSTRAINTS.BUSINESS_MODEL.MAX },
  { name: 'ContractNotes', Vo: ContractNotes, max: CONTRACT_CONSTRAINTS.NOTES.MAX },
  { name: 'SupportModel', Vo: SupportModel, max: CONTRACT_CONSTRAINTS.SUPPORT_MODEL.MAX }
])('$name (optional text)', ({ Vo, max }) => {
  it('should accept an empty string', () => {
    expect(Vo.create('').value).toBe('')
  })

  it('should throw for null/undefined', () => {
    expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => Vo.create('x'.repeat(max + 1))).toThrow(ContractError)
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

describe('CmsCaseId (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => CmsCaseId.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => CmsCaseId.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => CmsCaseId.create('x'.repeat(CONTRACT_CONSTRAINTS.CMS_CASE_ID.MAX + 1))).toThrow(ContractError)
  })

  it('should throw for inner whitespace', () => {
    const min = 1
    expect(() => CmsCaseId.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = 1
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: CONTRACT_CONSTRAINTS.CMS_CASE_ID.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(CmsCaseId.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('SubSolutionAreas', () => {
  it('should throw for a non-array', () => {
    expect(() => SubSolutionAreas.create('Sample' as unknown as string[])).toThrow(ContractError)
  })

  it('should accept an empty array', () => {
    expect(SubSolutionAreas.create([]).value).toEqual([])
  })

  it('should preserve a list of values', () => {
    const values = ['Sample A', 'Sample B']
    expect(SubSolutionAreas.create(values).value).toEqual(values)
  })
})

describe('IsFavorite', () => {
  it('should throw InvalidArgumentError for any non-boolean value', () => {
    fc.assert(
      fc.property(fc.oneof(fc.string(), fc.integer(), fc.object()), value => {
        expect(() => IsFavorite.create(value as unknown as boolean)).toThrow(InvalidArgumentError)
      }),
      { numRuns: 100 }
    )
  })

  it('should create for true and false', () => {
    expect(IsFavorite.create(true).value).toBe(true)
    expect(IsFavorite.create(false).value).toBe(false)
  })

  it('equals should compare by value', () => {
    expect(IsFavorite.create(true).equals(IsFavorite.create(true))).toBe(true)
    expect(IsFavorite.create(true).equals(IsFavorite.create(false))).toBe(false)
  })
})

describe('CmsCaseId — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    const sample = '12345'
    expect(CmsCaseId.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '12345'
    expect(() => CmsCaseId.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
  })
})

describe('BusinessModel — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(BusinessModel.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ContractNotes — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ContractNotes.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('SupportModel — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(SupportModel.create('  Sample text  ').value).toBe('Sample text')
  })
})
