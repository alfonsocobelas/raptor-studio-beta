import { Nullable } from '../../../../shared/domain/types'
import { ClientId } from '../../../../shared/domain/value-objects/clients/client-id.vo'
import { ClientAddress } from './value-objects/client-address.vo'
import { ClientCity } from './value-objects/client-city.vo'
import { ClientEmail } from './value-objects/client-email.vo'
import { ClientName } from './value-objects/client-name.vo'
import { ClientNotes } from './value-objects/client-notes.vo'
import { ClientPhone } from './value-objects/client-phone.vo'
import { ClientTaxId } from './value-objects/client-tax-id.vo'
import { ClientType } from './value-objects/client-type.vo'

export interface ClientAggregateProps {
  id: ClientId
  name: ClientName
  clientType: ClientType
  taxId: ClientTaxId
  email: ClientEmail
  phone: ClientPhone
  city: ClientCity
  address: ClientAddress
  notes: ClientNotes
}

export interface ClientPrimitiveProps {
  id: string
  name: string
  clientType: string
  taxId: string
  email: string
  phone: string
  city: string
  address: string
  notes: string
}

export type ClientUpdateProps = Partial<Omit<ClientPrimitiveProps, 'id'>>

export type ClientUniquenessUpdateProps = Pick<ClientUpdateProps, 'taxId'>

export interface RegisterClientProps {
  id: string
  name: string
  clientType: string
  taxId?: string
  email?: string
  phone?: string
  city?: string
  address?: string
  notes?: string
}
