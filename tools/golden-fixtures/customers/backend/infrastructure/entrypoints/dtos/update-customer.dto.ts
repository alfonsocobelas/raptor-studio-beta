import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { CUSTOMER_CONSTRAINTS as LIMITS } from '../../../domain/customer-constants'
import { CustomerType } from '../../../domain/value-objects/customer-type.vo'

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.SAP_ID.MIN)
  @MaxLength(LIMITS.SAP_ID.MAX)
  sapId?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.NAME.MAX)
  name?: string

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

  @IsOptional()
  @IsIn([...CustomerType.VALUES])
  customerType?: string
}
