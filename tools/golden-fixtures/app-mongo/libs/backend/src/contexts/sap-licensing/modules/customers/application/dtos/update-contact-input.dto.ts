import { CustomerContactUpdateProps } from '../../domain/customer-types'

export interface UpdateContactInput {
  customerId: string
  contactId: string
  updates: CustomerContactUpdateProps
}
