import { PeriodError } from '../../../../../../src/contexts/sap-licensing/shared/domain/period-error'
import { ContractDate } from '../../../../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-date.vo'
import { Period } from '../../../../../../src/contexts/sap-licensing/shared/domain/value-objects/period.vo'

const date = (iso: string): ContractDate => ContractDate.create(new Date(iso))

describe('Period (shared)', () => {
  describe('create — valid', () => {
    it('should create a period when end is after start', () => {
      const period = Period.create(date('2026-01-01'), date('2026-12-31'))
      expect(period.start?.equals(date('2026-01-01'))).toBe(true)
      expect(period.end?.equals(date('2026-12-31'))).toBe(true)
    })

    it('should create a period when end equals start', () => {
      const period = Period.create(date('2026-01-01'), date('2026-01-01'))
      expect(period.end?.equals(date('2026-01-01'))).toBe(true)
    })

    it('should create an open-ended period when end is null', () => {
      const period = Period.create(date('2026-01-01'), null)
      expect(period.start?.equals(date('2026-01-01'))).toBe(true)
      expect(period.end).toBeNull()
    })

    it('should create a start-less period: the source may only provide the end', () => {
      const period = Period.create(null, date('2026-12-31'))
      expect(period.start).toBeNull()
      expect(period.end?.equals(date('2026-12-31'))).toBe(true)
    })

    it('should create an empty period when both dates are unknown', () => {
      const period = Period.create(null, null)
      expect(period.start).toBeNull()
      expect(period.end).toBeNull()
    })
  })

  describe('create — invalid', () => {
    it('should throw PeriodError when end is before start', () => {
      expect(() => Period.create(date('2026-12-31'), date('2026-01-01'))).toThrow(PeriodError)
    })
  })
})
