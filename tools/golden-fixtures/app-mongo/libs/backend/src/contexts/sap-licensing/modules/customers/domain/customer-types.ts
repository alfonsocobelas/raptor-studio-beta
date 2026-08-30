import { Nullable } from '../../../../shared/domain/types'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { Phone } from '../../../shared/domain/value-objects/phone.vo'
import { CustomerAddress } from './value-objects/customer-address.vo'
import { CustomerCity } from './value-objects/customer-city.vo'
import { CustomerCountry } from './value-objects/customer-country.vo'
import { CustomerIndustry } from './value-objects/customer-industry.vo'
import { CustomerNotes } from './value-objects/customer-notes.vo'
import { CustomerType } from './value-objects/customer-type.vo'
import { SapId } from './value-objects/sap-id.vo'
import { TaxId } from './value-objects/tax-id.vo'
import { ContactId } from './value-objects/contact-id.vo'
import { ContactName } from './value-objects/contact-name.vo'
import { ContactRole } from './value-objects/contact-role.vo'
import { ContactEmail } from './value-objects/contact-email.vo'
import { IsPrimary } from './value-objects/is-primary.vo'

export interface CustomerAggregateProps {
  id: CustomerId
  sapId: SapId
  name: CustomerName
  taxId: TaxId
  industry: CustomerIndustry
  address: CustomerAddress
  phone: Phone
  notes: CustomerNotes
  city: CustomerCity
  country: CustomerCountry
  customerType: CustomerType
}

export interface CustomerPrimitiveProps {
  id: string
  sapId: string
  name: string
  taxId: string
  industry: string
  address: string
  phone: string
  notes: string
  city?: string
  country?: string
  customerType: string
  status?: string
  archivedAt?: Nullable<string>
  lastSeenInSyncAt?: Nullable<string>
  version: number
}

export type CustomerUpdateProps = Partial<
  Omit<CustomerPrimitiveProps, 'id' | 'status' | 'archivedAt' | 'lastSeenInSyncAt'>
>

export type CustomerUniquenessUpdateProps = Pick<CustomerUpdateProps, 'sapId' | 'taxId'>

export interface RegisterCustomerProps {
  id: string
  sapId: string
  name: string
  taxId?: string
  industry?: string
  address?: string
  phone?: string
  notes?: string
  city?: string
  country?: string
  customerType: string
}

export interface ContactAggregateProps {
  id: ContactId
  customerId: CustomerId
  name: ContactName
  role: ContactRole
  email: ContactEmail
  phone: Phone
  isPrimary: IsPrimary
}

export interface ContactPrimitiveProps {
  id: string
  customerId: string
  name: string
  role: string
  email: string
  phone: string
  isPrimary: boolean
}

export type ContactUpdateProps = Partial<Omit<ContactPrimitiveProps, 'id' | 'customerId' | 'isPrimary'>>

export type NewContactProps = Omit<ContactPrimitiveProps, 'customerId'>

export type CustomerContactUpdateProps = Partial<Omit<ContactPrimitiveProps, 'id' | 'customerId'>>
