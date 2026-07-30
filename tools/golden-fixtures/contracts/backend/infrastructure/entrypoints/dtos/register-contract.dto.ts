import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf
} from 'class-validator'
import { CONTRACT_CONSTRAINTS as LIMITS } from '../../../domain/contract-constants'
import { BillingFrequency } from '../../../domain/value-objects/billing-frequency.vo'
import { ContractSource } from '../../../domain/value-objects/contract-source.vo'
import { ContractStatus } from '../../../domain/value-objects/contract-status.vo'
import { ContractType } from '../../../domain/value-objects/contract-type.vo'
import { RenewalType } from '../../../domain/value-objects/renewal-type.vo'

export class RegisterContractDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsIn([...ContractType.VALUES])
  contractType!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(LIMITS.CONTRACT_NUMBER.MAX)
  contractNumber!: string

  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  customerId!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(LIMITS.CUSTOMER_NAME.MAX)
  customerName!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.CMS_CASE_ID.MAX)
  cmsCaseId?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.BUSINESS_MODEL.MAX)
  businessModel?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subSolutionAreas?: string[]

  @IsOptional()
  @IsInt()
  @Min(0)
  nbrOfContracts?: number

  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean

  @IsOptional()
  @IsIn([...ContractStatus.VALUES])
  status?: string

  @IsOptional()
  @IsIn([...ContractSource.VALUES])
  source?: string

  @IsString()
  @IsNotEmpty()
  startDate!: string

  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsString()
  endDate?: string | null

  @IsOptional()
  @IsNumber()
  @Min(0)
  totalValue?: number

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.CURRENCY.LENGTH)
  @MinLength(LIMITS.CURRENCY.LENGTH)
  currency?: string

  @IsOptional()
  @IsIn([...BillingFrequency.VALUES])
  billingFrequency?: string

  @IsOptional()
  @IsIn([...RenewalType.VALUES])
  renewalType?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.NOTES.MAX)
  notes?: string
}
