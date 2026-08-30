import { IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength, ValidateIf } from 'class-validator'
import { PROJECT_CONSTRAINTS as LIMITS } from '../../../domain/project-constants'
import { ProjectImplementer } from '../../../domain/value-objects/project-implementer.vo'
import { ProjectStatus } from '../../../domain/value-objects/project-status.vo'

export class UpdateProjectDto {
  @IsInt()
  @Min(1)
  version!: number

  @IsOptional()
  @IsString()
  @IsUUID('7')
  customerId?: string

  @IsOptional()
  @IsString()
  @MinLength(LIMITS.NAME.MIN)
  @MaxLength(LIMITS.NAME.MAX)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.DESCRIPTION.MAX)
  description?: string

  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsString()
  endDate?: string | null

  @IsOptional()
  @IsIn([...ProjectStatus.VALUES])
  status?: string

  @IsOptional()
  @IsIn([...ProjectImplementer.VALUES])
  implementer?: string
}
