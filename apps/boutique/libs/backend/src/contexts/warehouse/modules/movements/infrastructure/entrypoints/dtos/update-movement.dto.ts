import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'
import { MOVEMENT_CONSTRAINTS as LIMITS } from '../../../domain/movement-constants'
import { MovementReason } from '../../../domain/value-objects/movement-reason.vo'
import { MovementType } from '../../../domain/value-objects/movement-type.vo'

export class UpdateMovementDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.REFERENCE.MIN)
  @MaxLength(LIMITS.REFERENCE.MAX)
  reference?: string

  @IsOptional()
  @IsString()
  movementDate?: string

  @IsOptional()
  @IsIn([...MovementType.VALUES])
  movementType?: string

  @IsOptional()
  @IsString()
  @MinLength(LIMITS.GARMENT_LABEL.MIN)
  @MaxLength(LIMITS.GARMENT_LABEL.MAX)
  garmentLabel?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.COUNTERPARTY.MAX)
  counterparty?: string

  @IsOptional()
  @IsIn([...MovementReason.VALUES])
  reason?: string
}
