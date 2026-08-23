import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator'
import { PROJECT_CONSTRAINTS as LIMITS } from '../../../domain/project-constants'
import { ProjectImplementer } from '../../../domain/value-objects/project-implementer.vo'
import { ProjectStatus } from '../../../domain/value-objects/project-status.vo'

export class RegisterProjectDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  customerId!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.NAME.MIN)
  @MaxLength(LIMITS.NAME.MAX)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.DESCRIPTION.MAX)
  description?: string

  @IsString()
  @IsNotEmpty()
  startDate!: string

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
