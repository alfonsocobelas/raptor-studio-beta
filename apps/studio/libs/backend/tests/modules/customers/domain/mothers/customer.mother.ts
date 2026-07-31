import { Customer } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/customer'
import { CustomerPrimitiveProps } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/customer-types'
import { CustomerBuilder } from './customer.builder'

export class CustomerMother {
  static random(): Customer {
    return CustomerBuilder.aCustomer().build()
  }

  static randomList(count: number = 5): Customer[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<CustomerPrimitiveProps>): Customer {
    return CustomerBuilder.aCustomer().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<CustomerPrimitiveProps>): Customer {
    return CustomerBuilder.aCustomer().withProps(overrides).build()
  }

  static withSapId(sapId: string): Customer {
    return CustomerBuilder.aCustomer().withSapId(sapId).build()
  }

  static withTaxId(taxId: string): Customer {
    return CustomerBuilder.aCustomer().withTaxId(taxId).build()
  }

  static primitives(overrides?: Partial<CustomerPrimitiveProps>): CustomerPrimitiveProps {
    return CustomerBuilder.aCustomer().withProps(overrides).build().toPrimitives()
  }
}
