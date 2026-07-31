import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { PROJECT_CONSTRAINTS } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/project-constants'
import { ProjectError } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/project-errors'
import { ProjectDescription } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-description.vo'
import { ProjectName } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-name.vo'
import { SapProjectId } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/sap-project-id.vo'

describe.each([{ name: 'ProjectDescription', Vo: ProjectDescription, max: PROJECT_CONSTRAINTS.DESCRIPTION.MAX }])(
  '$name (optional text)',
  ({ Vo, max }) => {
    it('should accept an empty string', () => {
      expect(Vo.create('').value).toBe('')
    })

    it('should throw for null/undefined', () => {
      expect(() => Vo.create(null as unknown as string)).toThrow(InvalidArgumentError)
    })

    it('should throw when longer than the max', () => {
      expect(() => Vo.create('x'.repeat(max + 1))).toThrow(ProjectError)
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
  }
)

describe('ProjectName (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => ProjectName.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => ProjectName.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => ProjectName.create('x'.repeat(PROJECT_CONSTRAINTS.NAME.MAX + 1))).toThrow(ProjectError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => ProjectName.create('')).toThrow()
    expect(() => ProjectName.create('   ')).toThrow()
  })

  it('should throw for strings shorter than the min', () => {
    expect(() => ProjectName.create('a'.repeat(PROJECT_CONSTRAINTS.NAME.MIN - 1))).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = PROJECT_CONSTRAINTS.NAME.MIN
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: PROJECT_CONSTRAINTS.NAME.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(ProjectName.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('SapProjectId (constrained text)', () => {
  it('should throw for null/undefined', () => {
    expect(() => SapProjectId.create(null as unknown as string)).toThrow(InvalidArgumentError)
    expect(() => SapProjectId.create(undefined as unknown as string)).toThrow(InvalidArgumentError)
  })

  it('should throw when longer than the max', () => {
    expect(() => SapProjectId.create('x'.repeat(PROJECT_CONSTRAINTS.SAP_PROJECT_ID.MAX + 1))).toThrow(ProjectError)
  })

  it('should throw for an empty or whitespace-only string', () => {
    expect(() => SapProjectId.create('')).toThrow()
    expect(() => SapProjectId.create('   ')).toThrow()
  })

  it('should throw for inner whitespace', () => {
    const min = 1
    expect(() => SapProjectId.create(`${'a'.repeat(min)} ${'b'.repeat(min)}`)).toThrow()
  })

  it('should accept and preserve valid values', () => {
    const min = 1
    // fc.array + join en vez de stringOf: la API es idéntica en fast-check 3 y 4
    const alphanum = fc
      .array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
        minLength: min,
        maxLength: PROJECT_CONSTRAINTS.SAP_PROJECT_ID.MAX
      })
      .map(chars => chars.join(''))
    fc.assert(
      fc.property(alphanum, value => {
        expect(SapProjectId.create(value).value).toBe(value)
      }),
      { numRuns: 100 }
    )
  })
})

describe('ProjectName — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ProjectName.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('ProjectDescription — sanitization', () => {
  it('should trim edges and keep inner whitespace (free text)', () => {
    expect(ProjectDescription.create('  Sample text  ').value).toBe('Sample text')
  })
})

describe('SapProjectId — sanitization', () => {
  it('should trim leading and trailing whitespace', () => {
    const sample = '12345'
    expect(SapProjectId.create(`  ${sample}  `).value).toBe(sample)
  })

  it('should throw for inner whitespace (code field)', () => {
    const sample = '12345'
    expect(() => SapProjectId.create(`${sample} ${sample}`)).toThrow(InvalidArgumentError)
  })
})
