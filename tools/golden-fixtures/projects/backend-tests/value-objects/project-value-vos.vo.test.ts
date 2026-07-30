import fc from 'fast-check'
import { InvalidArgumentError } from '../../../../../src/contexts/shared/domain/errors'
import { PROJECT_CONSTRAINTS } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/project-constants'
import { ProjectError } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/project-errors'
import { ProjectDescription } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-description.vo'
import { ProjectName } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-name.vo'
import { SapProjectId } from '../../../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/sap-project-id.vo'

describe.each([
  { name: 'ProjectName', Vo: ProjectName, max: PROJECT_CONSTRAINTS.NAME.MAX },
  { name: 'ProjectDescription', Vo: ProjectDescription, max: PROJECT_CONSTRAINTS.DESCRIPTION.MAX },
  { name: 'SapProjectId', Vo: SapProjectId, max: PROJECT_CONSTRAINTS.SAP_PROJECT_ID.MAX }
])('$name (optional text)', ({ Vo, max }) => {
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
    expect(SapProjectId.create('  12345  ').value).toBe('12345')
  })

  it('should throw for inner whitespace (code field)', () => {
    expect(() => SapProjectId.create('12 345')).toThrow(InvalidArgumentError)
  })
})
