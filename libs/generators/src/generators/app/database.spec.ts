import { selectDatabase } from './database'

describe('selectDatabase', () => {
  it('defaults to postgres when the option is missing', () => {
    expect(selectDatabase(undefined)).toBe('postgres')
  })

  it('accepts the supported engines', () => {
    expect(selectDatabase('postgres')).toBe('postgres')
    expect(selectDatabase('mongo')).toBe('mongo')
  })

  it('rejects unknown engines listing the valid ones', () => {
    expect(() => selectDatabase('mysql')).toThrow(/mysql.*postgres, mongo/)
  })
})
