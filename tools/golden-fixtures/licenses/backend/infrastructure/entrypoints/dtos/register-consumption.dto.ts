import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'
import { ConsumptionSource, ConsumptionSourceValue } from '../../../domain/consumption-source'
import { LICENSE_CONSTRAINTS } from '../../../domain/license-constants'

export class RegisterConsumptionDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsInt()
  periodYear!: number

  @IsInt()
  @Min(LICENSE_CONSTRAINTS.PERIOD_MONTH.MIN)
  @Max(LICENSE_CONSTRAINTS.PERIOD_MONTH.MAX)
  periodMonth!: number

  @IsInt()
  @Min(0)
  units!: number

  @IsOptional()
  @IsIn([...ConsumptionSource.VALUES])
  source?: ConsumptionSourceValue
}
