import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PROJECT_CONSTRAINTS } from '../project-constants'
import { ProjectError } from '../project-errors'

export class ProjectDescription extends StringValueObject {
  protected static override fieldName = 'Project description'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ProjectDescription {
    this.ensureIsDefined(value)
    value = this.normalize(value)

    if (value.length > PROJECT_CONSTRAINTS.DESCRIPTION.MAX) {
      throw new ProjectError(`Project description must be at most ${PROJECT_CONSTRAINTS.DESCRIPTION.MAX} characters`)
    }

    return new ProjectDescription(value)
  }
}
