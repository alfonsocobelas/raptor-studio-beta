import { CustomerClassification } from './customer.dto'

export interface UpdateCustomerDto {
  sapId?: string
  name?: string
  taxId?: string
  industry?: string
  address?: string
  phone?: string
  notes?: string
  city?: string
  country?: string
  customerType?: CustomerClassification
  version: number
}
