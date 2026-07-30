import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator'
import { CUSTOMER_CONSTRAINTS as LIMITS } from '../../../domain/customer-constants'

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.CONTACT.NAME.MIN)
  @MaxLength(LIMITS.CONTACT.NAME.MAX)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.CONTACT.ROLE.MAX)
  role?: string

  // Vacio permitido (coherente con el dominio); si viene con valor, validar formato.
  @IsOptional()
  @ValidateIf((_obj, value) => value !== '')
  @IsEmail()
  @MaxLength(LIMITS.CONTACT.EMAIL.MAX)
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.PHONE.MAX)
  phone?: string

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}
