import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { ClientId } from '../../../../shared/domain/value-objects/clients/client-id.vo'
import {
  ClientAggregateProps,
  ClientPrimitiveProps,
  ClientUniquenessUpdateProps,
  ClientUpdateProps,
  RegisterClientProps
} from './client-types'
import { ClientAddress } from './value-objects/client-address.vo'
import { ClientCity } from './value-objects/client-city.vo'
import { ClientEmail } from './value-objects/client-email.vo'
import { ClientName } from './value-objects/client-name.vo'
import { ClientNotes } from './value-objects/client-notes.vo'
import { ClientPhone } from './value-objects/client-phone.vo'
import { ClientTaxId } from './value-objects/client-tax-id.vo'
import { ClientType } from './value-objects/client-type.vo'

export class Client extends AggregateRoot {
  private constructor(
    private readonly _id: ClientId,
    private _name: ClientName,
    private _clientType: ClientType,
    private _taxId: ClientTaxId,
    private _email: ClientEmail,
    private _phone: ClientPhone,
    private _city: ClientCity,
    private _address: ClientAddress,
    private _notes: ClientNotes
  ) {
    super()
  }

  //#region ...Getters...
  get id(): ClientId {
    return this._id
  }
  get name(): ClientName {
    return this._name
  }
  get clientType(): ClientType {
    return this._clientType
  }
  get taxId(): ClientTaxId {
    return this._taxId
  }
  get email(): ClientEmail {
    return this._email
  }
  get phone(): ClientPhone {
    return this._phone
  }
  get city(): ClientCity {
    return this._city
  }
  get address(): ClientAddress {
    return this._address
  }
  get notes(): ClientNotes {
    return this._notes
  }
  //#endregion

  static create(props: ClientAggregateProps): Client {
    return new Client(
      props.id,
      props.name,
      props.clientType,
      props.taxId,
      props.email,
      props.phone,
      props.city,
      props.address,
      props.notes
    )
  }

  static register(props: RegisterClientProps): Client {
    return Client.create({
      id: ClientId.create(props.id),
      name: ClientName.create(props.name),
      clientType: ClientType.create(props.clientType),
      taxId: ClientTaxId.create(props.taxId ?? ''),
      email: ClientEmail.create(props.email ?? ''),
      phone: ClientPhone.create(props.phone ?? ''),
      city: ClientCity.create(props.city ?? ''),
      address: ClientAddress.create(props.address ?? ''),
      notes: ClientNotes.create(props.notes ?? '')
    })
  }

  static fromPrimitives(props: ClientPrimitiveProps): Client {
    return new Client(
      ClientId.create(props.id),
      ClientName.create(props.name),
      ClientType.create(props.clientType),
      ClientTaxId.create(props.taxId),
      ClientEmail.create(props.email),
      ClientPhone.create(props.phone),
      ClientCity.create(props.city),
      ClientAddress.create(props.address),
      ClientNotes.create(props.notes)
    )
  }

  toPrimitives(): ClientPrimitiveProps {
    return {
      id: this._id.value,
      name: this._name.value,
      clientType: this._clientType.value,
      taxId: this._taxId.value,
      email: this._email.value,
      phone: this._phone.value,
      city: this._city.value,
      address: this._address.value,
      notes: this._notes.value
    }
  }

  updateDetails(updates: ClientUpdateProps): void {
    if (updates.name !== undefined) {
      this._name = ClientName.create(updates.name)
    }
    if (updates.clientType !== undefined) {
      this._clientType = ClientType.create(updates.clientType)
    }
    if (updates.taxId !== undefined) {
      this._taxId = ClientTaxId.create(updates.taxId)
    }
    if (updates.email !== undefined) {
      this._email = ClientEmail.create(updates.email)
    }
    if (updates.phone !== undefined) {
      this._phone = ClientPhone.create(updates.phone)
    }
    if (updates.city !== undefined) {
      this._city = ClientCity.create(updates.city)
    }
    if (updates.address !== undefined) {
      this._address = ClientAddress.create(updates.address)
    }
    if (updates.notes !== undefined) {
      this._notes = ClientNotes.create(updates.notes)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Client)) {
      return false
    }
    return this._id.equals(other._id)
  }

  newTaxIdIfChanged(updates: ClientUniquenessUpdateProps): Undefinable<ClientTaxId> {
    if (!updates.taxId) {
      return
    }

    const newTaxId = ClientTaxId.create(updates.taxId)

    if (this._taxId.equals(newTaxId)) {
      return
    }

    return newTaxId
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
