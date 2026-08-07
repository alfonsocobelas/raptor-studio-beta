import { InvalidArgumentError } from '../../../../../../src/contexts/shared/domain/errors'
import { SyncTimestamp } from '../../../../../../src/contexts/sap-licensing/shared/domain/value-objects/sync-timestamp.vo'

describe('SyncTimestamp', () => {
  it('should create from a valid date and expose the ISO string', () => {
    const date = new Date('2026-07-12T06:00:00.000Z')

    const timestamp = SyncTimestamp.create(date)

    expect(timestamp.toISOString()).toBe('2026-07-12T06:00:00.000Z')
  })

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['invalid date', new Date('not-a-date')]
  ])('should throw InvalidArgumentError for %s', (_label, value) => {
    expect(() => SyncTimestamp.create(value as unknown as Date)).toThrow(InvalidArgumentError)
  })

  it('should create from a valid ISO string via fromISOString', () => {
    const timestamp = SyncTimestamp.fromISOString('2026-07-12T06:00:00.000Z')

    expect(timestamp.toISOString()).toBe('2026-07-12T06:00:00.000Z')
  })

  it('should throw InvalidArgumentError for an unparseable string', () => {
    expect(() => SyncTimestamp.fromISOString('no-date')).toThrow(InvalidArgumentError)
  })

  it('should represent an event that never happened as null via never()', () => {
    expect(SyncTimestamp.never()).toBeNull()
  })
})
