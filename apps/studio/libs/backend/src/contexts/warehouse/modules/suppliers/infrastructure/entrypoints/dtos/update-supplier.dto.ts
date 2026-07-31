import { IsEmail, IsInt, IsOptional, IsString, MaxLength, Min, MinLength, ValidateIf } from 'class-validator'
import { SUPPLIER_CONSTRAINTS as LIMITS } from '../../../domain/supplier-constants'

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.NAME.MIN)
  @MaxLength(LIMITS.NAME.MAX)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.TAX_ID.MAX)
  taxId?: string

  // Vacio permitido (coherente con el dominio); si viene con valor, validar formato.
  @IsOptional()
  @ValidateIf((_obj, value) => value !== '')
  @IsEmail()
  @MaxLength(LIMITS.EMAIL.MAX)
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.PHONE.MAX)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.CITY.MAX)
  city?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number
}
