import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
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

export class UpdateContractDto {
  @IsOptional()
  @IsIn([...ContractType.VALUES])
  contractType?: string

  @IsOptional()
  @IsString()
  @MinLength(LIMITS.CONTRACT_NUMBER.MIN)
  @MaxLength(LIMITS.CONTRACT_NUMBER.MAX)
  contractNumber?: string

  @IsOptional()
  @IsString()
  @MinLength(LIMITS.CUSTOMER_NAME.MIN)
  @MaxLength(LIMITS.CUSTOMER_NAME.MAX)
  customerName?: string

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

  @IsOptional()
  @IsString()
  startDate?: string

  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @IsString()
  endDate?: string | null

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
