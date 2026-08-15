import { Clock } from '@raptor/infra-ports'

export class SystemClock extends Clock {
  now(): Date {
    return new Date()
  }
}
