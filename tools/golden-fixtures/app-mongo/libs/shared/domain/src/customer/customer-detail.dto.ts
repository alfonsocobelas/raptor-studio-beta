import { ContactDto } from './child.dto'
import { CustomerDto } from './customer.dto'

export interface CustomerDetailDto extends CustomerDto {
  contacts: ContactDto[]
}
