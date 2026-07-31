import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'
import { VEHICLE_CONSTRAINTS as LIMITS } from '../../../domain/vehicle-constants'
import { FuelType } from '../../../domain/value-objects/fuel-type.vo'
import { VehicleStatus } from '../../../domain/value-objects/vehicle-status.vo'

export class RegisterVehicleDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.VIN.MIN)
  @MaxLength(LIMITS.VIN.MAX)
  vin!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.BRAND.MIN)
  @MaxLength(LIMITS.BRAND.MAX)
  brand!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.MODEL.MIN)
  @MaxLength(LIMITS.MODEL.MAX)
  model!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.VERSION.MAX)
  version?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.PLATE.MAX)
  plate?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.COLOR.MAX)
  color?: string

  @IsIn([...FuelType.VALUES])
  fuel!: string

  @IsInt()
  @Min(0)
  year!: number

  @IsInt()
  @Min(0)
  mileage!: number

  @IsNumber()
  @Min(0)
  price!: number

  @IsIn([...VehicleStatus.VALUES])
  status!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.NOTES.MAX)
  notes?: string
}
