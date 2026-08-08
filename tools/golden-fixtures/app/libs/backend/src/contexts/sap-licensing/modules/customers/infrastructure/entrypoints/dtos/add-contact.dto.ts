import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf
} from 'class-validator'
import { CUSTOMER_CONSTRAINTS as LIMITS } from '../../../domain/customer-constants'

export class AddContactDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.CONTACT.NAME.MIN)
  @MaxLength(LIMITS.CONTACT.NAME.MAX)
  name!: string

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
