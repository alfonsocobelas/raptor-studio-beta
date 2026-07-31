import { Nullable } from '../../../../shared/domain/types'
import { SupplierId } from '../../../../shared/domain/value-objects/suppliers/supplier-id.vo'
import { LeadTimeDays } from './value-objects/lead-time-days.vo'
import { SupplierCity } from './value-objects/supplier-city.vo'
import { SupplierEmail } from './value-objects/supplier-email.vo'
import { SupplierName } from './value-objects/supplier-name.vo'
import { SupplierPhone } from './value-objects/supplier-phone.vo'
import { SupplierTaxId } from './value-objects/supplier-tax-id.vo'

export interface SupplierAggregateProps {
  id: SupplierId
  name: SupplierName
  taxId: SupplierTaxId
  email: SupplierEmail
  phone: SupplierPhone
  city: SupplierCity
  leadTimeDays: LeadTimeDays
}

export interface SupplierPrimitiveProps {
  id: string
  name: string
  taxId: string
  email: string
  phone: string
  city: string
  leadTimeDays: number
}

export type SupplierUpdateProps = Partial<Omit<SupplierPrimitiveProps, 'id'>>

export type SupplierUniquenessUpdateProps = Pick<SupplierUpdateProps, 'taxId'>

export interface RegisterSupplierProps {
  id: string
  name: string
  taxId?: string
  email?: string
  phone?: string
  city?: string
  leadTimeDays: number
}
