import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator'
import { SALE_CONSTRAINTS as LIMITS } from '../../../domain/sale-constants'
import { PaymentMethod } from '../../../domain/value-objects/payment-method.vo'
import { SaleStatus } from '../../../domain/value-objects/sale-status.vo'

export class RegisterSaleDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('7')
  id!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.REFERENCE.MIN)
  @MaxLength(LIMITS.REFERENCE.MAX)
  reference!: string

  @IsString()
  @IsNotEmpty()
  saleDate!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.VEHICLE_LABEL.MIN)
  @MaxLength(LIMITS.VEHICLE_LABEL.MAX)
  vehicleLabel!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(LIMITS.CLIENT_LABEL.MIN)
  @MaxLength(LIMITS.CLIENT_LABEL.MAX)
  clientLabel!: string

  @IsOptional()
  @IsString()
  @MaxLength(LIMITS.SALESPERSON.MAX)
  salesperson?: string

  @IsNumber()
  @Min(0)
  amount!: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number

  @IsIn([...PaymentMethod.VALUES])
  paymentMethod!: string

  @IsIn([...SaleStatus.VALUES])
  status!: string
}
