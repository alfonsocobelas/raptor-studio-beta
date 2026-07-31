import { Nullable } from '../../../../shared/domain/types'
import { SaleId } from '../../../../shared/domain/value-objects/sales/sale-id.vo'
import { PaymentMethod } from './value-objects/payment-method.vo'
import { SaleAmount } from './value-objects/sale-amount.vo'
import { SaleClientLabel } from './value-objects/sale-client-label.vo'
import { SaleDate } from './value-objects/sale-date.vo'
import { SaleDiscount } from './value-objects/sale-discount.vo'
import { SaleReference } from './value-objects/sale-reference.vo'
import { SaleStatus } from './value-objects/sale-status.vo'
import { SaleVehicleLabel } from './value-objects/sale-vehicle-label.vo'
import { Salesperson } from './value-objects/salesperson.vo'

export interface SaleAggregateProps {
  id: SaleId
  reference: SaleReference
  saleDate: SaleDate
  vehicleLabel: SaleVehicleLabel
  clientLabel: SaleClientLabel
  salesperson: Salesperson
  amount: SaleAmount
  discount: SaleDiscount
  paymentMethod: PaymentMethod
  status: SaleStatus
}

export interface SalePrimitiveProps {
  id: string
  reference: string
  saleDate: string
  vehicleLabel: string
  clientLabel: string
  salesperson: string
  amount: number
  discount: number
  paymentMethod: string
  status: string
}

export type SaleUpdateProps = Partial<Omit<SalePrimitiveProps, 'id'>>

export type SaleUniquenessUpdateProps = Pick<SaleUpdateProps, 'reference'>

export interface RegisterSaleProps {
  id: string
  reference: string
  saleDate: string
  vehicleLabel: string
  clientLabel: string
  salesperson?: string
  amount: number
  discount?: number
  paymentMethod: string
  status: string
}
