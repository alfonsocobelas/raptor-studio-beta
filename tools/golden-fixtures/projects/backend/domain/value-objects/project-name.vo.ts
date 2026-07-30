import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PROJECT_CONSTRAINTS } from '../project-constants'
import { ProjectError } from '../project-errors'

export class ProjectName extends StringValueObject {
  protected static override fieldName = 'Project name'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): ProjectName {
    this.ensureIsString(value)
    value = this.normalize(value)

    if (value.length < PROJECT_CONSTRAINTS.NAME.MIN) {
      throw new ProjectError(`Project name must be at least ${PROJECT_CONSTRAINTS.NAME.MIN} characters`)
    }

    if (value.length > PROJECT_CONSTRAINTS.NAME.MAX) {
      throw new ProjectError(`Project name must be at most ${PROJECT_CONSTRAINTS.NAME.MAX} characters`)
    }

    return new ProjectName(value)
  }
}
