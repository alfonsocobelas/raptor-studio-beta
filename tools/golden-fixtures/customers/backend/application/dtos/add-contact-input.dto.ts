import { AddContactDto } from '@sap-licenses/shared/domain'

export interface AddContactInput {
  customerId: string
  contact: AddContactDto
}
