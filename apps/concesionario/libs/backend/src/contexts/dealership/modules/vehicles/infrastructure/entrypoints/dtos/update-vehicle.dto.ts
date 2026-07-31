import { IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'
import { VEHICLE_CONSTRAINTS as LIMITS } from '../../../domain/vehicle-constants'
import { FuelType } from '../../../domain/value-objects/fuel-type.vo'
import { VehicleStatus } from '../../../domain/value-objects/vehicle-status.vo'

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.VIN.MIN)
  @MaxLength(LIMITS.VIN.MAX)
  vin?: string

  @IsOptional()
  @IsString()
  @MinLength(LIMITS.BRAND.MIN)
  @MaxLength(LIMITS.BRAND.MAX)
  brand?: string

  @IsOptional()
  @IsString()
  @MinLength(LIMITS.MODEL.MIN)
  @MaxLength(LIMITS.MODEL.MAX)
  model?: string

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

  @IsOptional()
  @IsIn([...FuelType.VALUES])
  fuel?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  year?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  mileage?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsIn([...VehicleStatus.VALUES])
  status?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.NOTES.MAX)
  notes?: string
}
