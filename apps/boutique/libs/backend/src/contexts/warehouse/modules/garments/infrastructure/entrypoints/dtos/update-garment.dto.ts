import { IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'
import { GARMENT_CONSTRAINTS as LIMITS } from '../../../domain/garment-constants'
import { GarmentCategory } from '../../../domain/value-objects/garment-category.vo'
import { GarmentSize } from '../../../domain/value-objects/garment-size.vo'
import { GarmentStatus } from '../../../domain/value-objects/garment-status.vo'

export class UpdateGarmentDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.SKU.MIN)
  @MaxLength(LIMITS.SKU.MAX)
  sku?: string

  @IsOptional()
  @IsString()
  @MinLength(LIMITS.NAME.MIN)
  @MaxLength(LIMITS.NAME.MAX)
  name?: string

  @IsOptional()
  @IsIn([...GarmentCategory.VALUES])
  category?: string

  @IsOptional()
  @IsIn([...GarmentSize.VALUES])
  size?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.BRAND.MAX)
  brand?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.COLOR.MAX)
  color?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number

  @IsOptional()
  @IsIn([...GarmentStatus.VALUES])
  status?: string
}
