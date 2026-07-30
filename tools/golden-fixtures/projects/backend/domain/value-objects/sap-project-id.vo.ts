import { StringValueObject } from '../../../../../shared/domain/value-objects/string-value-object'
import { PROJECT_CONSTRAINTS } from '../project-constants'
import { ProjectError } from '../project-errors'

export class SapProjectId extends StringValueObject {
  protected static override fieldName = 'SAP project ID'

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): SapProjectId {
    this.ensureIsString(value)
    value = this.normalize(value)
    this.ensureHasNoInnerWhitespace(value)

    if (value.length > PROJECT_CONSTRAINTS.SAP_PROJECT_ID.MAX) {
      throw new ProjectError(`SAP project ID must be at most ${PROJECT_CONSTRAINTS.SAP_PROJECT_ID.MAX} characters`)
    }

    return new SapProjectId(value)
  }
}
