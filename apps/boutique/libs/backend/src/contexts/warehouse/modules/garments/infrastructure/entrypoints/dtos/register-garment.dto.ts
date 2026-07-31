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
import { GARMENT_CONSTRAINTS as LIMITS } from '../../../domain/garment-constants'
import { GarmentCategory } from '../../../domain/value-objects/garment-category.vo'
import { GarmentSize } from '../../../domain/value-objects/garment-size.vo'
import { GarmentStatus } from '../../../domain/value-objects/garment-status.vo'

export class RegisterGarmentDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.SKU.MIN)
  @MaxLength(LIMITS.SKU.MAX)
  sku!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.NAME.MIN)
  @MaxLength(LIMITS.NAME.MAX)
  name!: string

  @IsIn([...GarmentCategory.VALUES])
  category!: string

  @IsIn([...GarmentSize.VALUES])
  size!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.BRAND.MAX)
  brand?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.COLOR.MAX)
  color?: string

  @IsNumber()
  @Min(0)
  price!: number

  @IsInt()
  @Min(0)
  stock!: number

  @IsIn([...GarmentStatus.VALUES])
  status!: string
}
