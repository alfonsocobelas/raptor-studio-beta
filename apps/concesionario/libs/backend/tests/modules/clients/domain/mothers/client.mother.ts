import { Client } from '../../../../../src/contexts/dealership/modules/clients/domain/client'
import { ClientPrimitiveProps } from '../../../../../src/contexts/dealership/modules/clients/domain/client-types'
import { ClientBuilder } from './client.builder'

export class ClientMother {
  static random(): Client {
    return ClientBuilder.aClient().build()
  }

  static randomList(count: number = 5): Client[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<ClientPrimitiveProps>): Client {
    return ClientBuilder.aClient().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<ClientPrimitiveProps>): Client {
    return ClientBuilder.aClient().withProps(overrides).build()
  }

  static withTaxId(taxId: string): Client {
    return ClientBuilder.aClient().withTaxId(taxId).build()
  }

  static primitives(overrides?: Partial<ClientPrimitiveProps>): ClientPrimitiveProps {
    return ClientBuilder.aClient().withProps(overrides).build().toPrimitives()
  }
}
