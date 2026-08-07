import { Nullable } from '../../../../shared/domain/types'
import { DateValueObject } from '../../../../shared/domain/value-objects/date-value-object'
import { PeriodError } from '../period-error'

export class Period {
  private constructor(
    private readonly _start: Nullable<DateValueObject>,
    private readonly _end: Nullable<DateValueObject>
  ) {}

  static create(start: Nullable<DateValueObject>, end: Nullable<DateValueObject>): Period {
    if (start && end && end.isBefore(start)) {
      throw new PeriodError('End date must be on or after the start date')
    }
    return new Period(start, end)
  }

  get start(): Nullable<DateValueObject> {
    return this._start
  }

  get end(): Nullable<DateValueObject> {
    return this._end
  }
}
