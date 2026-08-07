import { InvalidArgumentError } from '../../../../../../src/contexts/shared/domain/errors'
import { ContractDate } from '../../../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-date.vo'

describe('ContractDate (shared)', () => {
  it('should throw InvalidArgumentError for an invalid date', () => {
    expect(() => ContractDate.create(new Date('not-a-date'))).toThrow(InvalidArgumentError)
  })

  it('should throw InvalidArgumentError for a non-Date value', () => {
    expect(() => ContractDate.create('2026-01-15' as unknown as Date)).toThrow(InvalidArgumentError)
  })

  it('should throw InvalidArgumentError for null', () => {
    expect(() => ContractDate.create(null as unknown as Date)).toThrow(InvalidArgumentError)
  })

  it('should throw InvalidArgumentError for undefined', () => {
    expect(() => ContractDate.create(undefined as unknown as Date)).toThrow(InvalidArgumentError)
  })

  it('should preserve a valid date', () => {
    const date = new Date('2026-01-15')
    expect(ContractDate.create(date).value).toEqual(date)
  })

  it('should be equal for the same date value', () => {
    expect(ContractDate.create(new Date('2026-01-15')).equals(ContractDate.create(new Date('2026-01-15')))).toBe(true)
  })

  it('unset() should return null', () => {
    expect(ContractDate.unset()).toBeNull()
  })
})
