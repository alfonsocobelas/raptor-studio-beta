import { v7 as uuidv7 } from 'uuid'
import { Customer } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/customer'
import { CustomerPrimitiveProps } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/customer-types'
import { CustomerAddress } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-address.vo'
import { CustomerCity } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-city.vo'
import { CustomerCountry } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-country.vo'
import { CustomerIndustry } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-industry.vo'
import { CustomerNotes } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-notes.vo'
import { CustomerType } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/customer-type.vo'
import { SapId } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/sap-id.vo'
import { TaxId } from '../../../../../src/contexts/sap-licensing/modules/customers/domain/value-objects/tax-id.vo'
import { CustomerName } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/customer-name.vo'
import { Phone } from '../../../../../src/contexts/sap-licensing/shared/domain/value-objects/phone.vo'
import { CustomerId } from '../../../../../src/contexts/shared/domain/value-objects/customers/customer-id.vo'

const randomSapId = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

const randomTaxId = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

export class CustomerBuilder {
  private props: CustomerPrimitiveProps = {
    id: uuidv7(),
    sapId: randomSapId(),
    name: 'Name 1',
    taxId: randomTaxId(),
    industry: '',
    address: '',
    phone: '',
    notes: '',
    city: '',
    country: '',
    customerType: 'CustomerType 1',
    status: 'active',
    archivedAt: null,
    lastSeenInSyncAt: null
  }

  static aCustomer(): CustomerBuilder {
    return new CustomerBuilder()
  }

  withId(id: string): CustomerBuilder {
    this.props.id = id
    return this
  }

  withSapId(sapId: string): CustomerBuilder {
    this.props.sapId = sapId
    return this
  }

  withTaxId(taxId: string): CustomerBuilder {
    this.props.taxId = taxId
    return this
  }

  withCustomerType(customerType: string): CustomerBuilder {
    this.props.customerType = customerType
    return this
  }

  withStatus(status: string): CustomerBuilder {
    this.props.status = status
    return this
  }

  withProps(overrides?: Partial<CustomerPrimitiveProps>): CustomerBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Customer {
    return Customer.create({
      id: CustomerId.create(this.props.id),
      sapId: SapId.create(this.props.sapId),
      name: CustomerName.create(this.props.name),
      taxId: TaxId.create(this.props.taxId),
      industry: CustomerIndustry.create(this.props.industry),
      address: CustomerAddress.create(this.props.address),
      phone: Phone.create(this.props.phone),
      notes: CustomerNotes.create(this.props.notes),
      city: CustomerCity.create(this.props.city ?? ''),
      country: CustomerCountry.create(this.props.country ?? ''),
      customerType: CustomerType.create(this.props.customerType)
    })
  }

  build(): Customer {
    return Customer.fromPrimitives(this.props)
  }
}
