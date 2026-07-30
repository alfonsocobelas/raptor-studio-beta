import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator'
import { SALE_CONSTRAINTS as LIMITS } from '../../../domain/sale-constants'
import { PaymentMethod } from '../../../domain/value-objects/payment-method.vo'
import { SaleStatus } from '../../../domain/value-objects/sale-status.vo'

export class UpdateSaleDto {
  @IsOptional()
  @IsString()
  @MinLength(LIMITS.REFERENCE.MIN)
  @MaxLength(LIMITS.REFERENCE.MAX)
  reference?: string

  @IsOptional()
  @IsString()
  saleDate?: string

  @IsOptional()
  @IsString()
  @MinLength(LIMITS.VEHICLE_LABEL.MIN)
  @MaxLength(LIMITS.VEHICLE_LABEL.MAX)
  vehicleLabel?: string

  @IsOptional()
  @IsString()
  @MinLength(LIMITS.CLIENT_LABEL.MIN)
  @MaxLength(LIMITS.CLIENT_LABEL.MAX)
  clientLabel?: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.SALESPERSON.MAX)
  salesperson?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number

  @IsOptional()
  @IsIn([...PaymentMethod.VALUES])
  paymentMethod?: string

  @IsOptional()
  @IsIn([...SaleStatus.VALUES])
  status?: string
}
