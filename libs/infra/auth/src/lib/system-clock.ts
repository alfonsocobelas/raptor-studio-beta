import { Clock } from '@acc/infra-ports'

export class SystemClock extends Clock {
  now(): Date {
    return new Date()
  }
}
