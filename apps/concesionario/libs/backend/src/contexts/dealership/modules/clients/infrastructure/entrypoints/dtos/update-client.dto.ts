import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator'
import { CLIENT_CONSTRAINTS as LIMITS } from '../../../domain/client-constants'
import { ClientType } from '../../../domain/value-objects/client-type.vo'

export class UpdateClientDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.NAME.MIN)
  @MaxLength(LIMITS.NAME.MAX)
  name?: string

  @IsOptional()
  @IsIn([...ClientType.VALUES])
  clientType?: string

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
  @IsString()
  @MaxLength(LIMITS.ADDRESS.MAX)
  address?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.NOTES.MAX)
  notes?: string
}
