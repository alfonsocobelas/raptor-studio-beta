import { ConsumptionSourceValue } from '../../domain/consumption-source'

export interface RegisterConsumptionInput {
  id: string
  licenseId: string
  periodYear: number
  periodMonth: number
  units: number
  source?: ConsumptionSourceValue
}
