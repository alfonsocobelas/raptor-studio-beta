import { CustomerUpdateProps } from '../../domain/customer-types'

export interface UpdateCustomerInput {
  id: string
  updates: CustomerUpdateProps
}
