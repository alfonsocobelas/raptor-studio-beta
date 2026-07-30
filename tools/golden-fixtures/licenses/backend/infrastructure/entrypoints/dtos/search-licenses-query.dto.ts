import { Transform } from 'class-transformer'
import { IsIn, IsOptional } from 'class-validator'
import { PaginateOffsetDto } from '../../../../../../shared/infrastructure/dtos/paginate-offset.dto'

const HEALTH_VALUES = ['healthy', 'underused', 'overused', 'contractual_breach']

export class SearchLicensesQueryDto extends PaginateOffsetDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]))
  @IsIn(HEALTH_VALUES, { each: true })
  health?: string[]
}
