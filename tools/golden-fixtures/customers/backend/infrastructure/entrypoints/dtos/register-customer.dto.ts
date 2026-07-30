import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator'
import { CUSTOMER_CONSTRAINTS as LIMITS } from '../../../domain/customer-constants'
import { CustomerType } from '../../../domain/value-objects/customer-type.vo'

export class RegisterCustomerDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.SAP_ID.MIN)
  @MaxLength(LIMITS.SAP_ID.MAX)
  sapId!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(LIMITS.NAME.MAX)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.TAX_ID.MAX)
  taxId?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.INDUSTRY.MAX)
  industry?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.ADDRESS.MAX)
  address?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.PHONE.MAX)
  phone?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.NOTES.MAX)
  notes?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.CITY.MAX)
  city?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.COUNTRY.MAX)
  country?: string

  @IsIn([...CustomerType.VALUES])
  customerType!: string
}
