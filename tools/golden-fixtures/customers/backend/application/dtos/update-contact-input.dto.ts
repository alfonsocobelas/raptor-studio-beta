import { UpdateContactDto } from '@sap-licenses/shared/domain'

export interface UpdateContactInput {
  customerId: string
  contactId: string
  updates: UpdateContactDto
}
