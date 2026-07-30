import { v7 as uuidv7 } from 'uuid'
import { Client } from '../../../../../src/contexts/dealership/modules/clients/domain/client'
import { ClientPrimitiveProps } from '../../../../../src/contexts/dealership/modules/clients/domain/client-types'
import { ClientAddress } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-address.vo'
import { ClientCity } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-city.vo'
import { ClientEmail } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-email.vo'
import { ClientName } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-name.vo'
import { ClientNotes } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-notes.vo'
import { ClientPhone } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-phone.vo'
import { ClientTaxId } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-tax-id.vo'
import { ClientType } from '../../../../../src/contexts/dealership/modules/clients/domain/value-objects/client-type.vo'
import { ClientId } from '../../../../../src/contexts/shared/domain/value-objects/clients/client-id.vo'

const randomTaxId = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

export class ClientBuilder {
  private props: ClientPrimitiveProps = {
    id: uuidv7(),
    name: 'Name 1',
    clientType: 'individual',
    taxId: randomTaxId(),
    email: '',
    phone: '',
    city: '',
    address: '',
    notes: ''
  }

  static aClient(): ClientBuilder {
    return new ClientBuilder()
  }

  withId(id: string): ClientBuilder {
    this.props.id = id
    return this
  }

  withClientType(clientType: string): ClientBuilder {
    this.props.clientType = clientType
    return this
  }

  withTaxId(taxId: string): ClientBuilder {
    this.props.taxId = taxId
    return this
  }

  withProps(overrides?: Partial<ClientPrimitiveProps>): ClientBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Client {
    return Client.create({
      id: ClientId.create(this.props.id),
      name: ClientName.create(this.props.name),
      clientType: ClientType.create(this.props.clientType),
      taxId: ClientTaxId.create(this.props.taxId),
      email: ClientEmail.create(this.props.email),
      phone: ClientPhone.create(this.props.phone),
      city: ClientCity.create(this.props.city),
      address: ClientAddress.create(this.props.address),
      notes: ClientNotes.create(this.props.notes)
    })
  }

  build(): Client {
    return Client.fromPrimitives(this.props)
  }
}
