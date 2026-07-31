import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator'
import { MOVEMENT_CONSTRAINTS as LIMITS } from '../../../domain/movement-constants'
import { MovementReason } from '../../../domain/value-objects/movement-reason.vo'
import { MovementType } from '../../../domain/value-objects/movement-type.vo'

export class RegisterMovementDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.REFERENCE.MIN)
  @MaxLength(LIMITS.REFERENCE.MAX)
  reference!: string

  @IsString()
  @IsNotEmpty()
  movementDate!: string

  @IsIn([...MovementType.VALUES])
  movementType!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.GARMENT_LABEL.MIN)
  @MaxLength(LIMITS.GARMENT_LABEL.MAX)
  garmentLabel!: string

  @IsInt()
  @Min(0)
  quantity!: number

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.COUNTERPARTY.MAX)
  counterparty?: string

  @IsIn([...MovementReason.VALUES])
  reason!: string
}
