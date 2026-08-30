import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { CustomerName } from '../../../shared/domain/value-objects/customer-name.vo'
import { Phone } from '../../../shared/domain/value-objects/phone.vo'
import { SyncTimestamp } from '../../../shared/domain/value-objects/sync-timestamp.vo'
import {
  ContactPrimitiveProps,
  CustomerAggregateProps,
  CustomerContactUpdateProps,
  CustomerPrimitiveProps,
  CustomerUniquenessUpdateProps,
  CustomerUpdateProps,
  NewContactProps,
  RegisterCustomerProps
} from './customer-types'
import { CustomerAddress } from './value-objects/customer-address.vo'
import { CustomerCity } from './value-objects/customer-city.vo'
import { CustomerCountry } from './value-objects/customer-country.vo'
import { CustomerIndustry } from './value-objects/customer-industry.vo'
import { CustomerNotes } from './value-objects/customer-notes.vo'
import { CustomerStatus } from './value-objects/customer-status.vo'
import { CustomerType } from './value-objects/customer-type.vo'
import { SapId } from './value-objects/sap-id.vo'
import { TaxId } from './value-objects/tax-id.vo'
import { EntityNotFoundError } from '../../../../shared/domain/errors'
import { Contact } from './contact'
import { ContactId } from './value-objects/contact-id.vo'
import { CUSTOMER_CONSTRAINTS } from './customer-constants'
import { CustomerError } from './customer-errors'

export class Customer extends AggregateRoot {
  private constructor(
    private readonly _id: CustomerId,
    private _sapId: SapId,
    private _name: CustomerName,
    private _taxId: TaxId,
    private _industry: CustomerIndustry,
    private _address: CustomerAddress,
    private _phone: Phone,
    private _notes: CustomerNotes,
    private _city: CustomerCity,
    private _country: CustomerCountry,
    private _customerType: CustomerType,
    private readonly _contacts: Contact[],
    private _status: CustomerStatus,
    private _archivedAt: Nullable<SyncTimestamp>,
    private _lastSeenInSyncAt: Nullable<SyncTimestamp>,
    private readonly _version: number
  ) {
    super()
  }

  //#region ...Getters...
  get id(): CustomerId {
    return this._id
  }
  get sapId(): SapId {
    return this._sapId
  }
  get name(): CustomerName {
    return this._name
  }
  get taxId(): TaxId {
    return this._taxId
  }
  get industry(): CustomerIndustry {
    return this._industry
  }
  get address(): CustomerAddress {
    return this._address
  }
  get phone(): Phone {
    return this._phone
  }
  get notes(): CustomerNotes {
    return this._notes
  }
  get city(): CustomerCity {
    return this._city
  }
  get country(): CustomerCountry {
    return this._country
  }
  get customerType(): CustomerType {
    return this._customerType
  }
  get contacts(): readonly Contact[] {
    return this._contacts
  }
  get status(): CustomerStatus {
    return this._status
  }
  get archivedAt(): Nullable<SyncTimestamp> {
    return this._archivedAt
  }
  get lastSeenInSyncAt(): Nullable<SyncTimestamp> {
    return this._lastSeenInSyncAt
  }
  get version(): number {
    return this._version
  }
  //#endregion

  static create(props: CustomerAggregateProps, contacts: Contact[] = []): Customer {
    return new Customer(
      props.id,
      props.sapId,
      props.name,
      props.taxId,
      props.industry,
      props.address,
      props.phone,
      props.notes,
      props.city,
      props.country,
      props.customerType,
      contacts,
      CustomerStatus.create('active'),
      null,
      null,
      1
    )
  }

  static register(props: RegisterCustomerProps): Customer {
    return Customer.create({
      id: CustomerId.create(props.id),
      sapId: SapId.create(props.sapId),
      name: CustomerName.create(props.name),
      taxId: TaxId.create(props.taxId ?? ''),
      industry: CustomerIndustry.create(props.industry ?? ''),
      address: CustomerAddress.create(props.address ?? ''),
      phone: Phone.create(props.phone ?? ''),
      notes: CustomerNotes.create(props.notes ?? ''),
      city: CustomerCity.create(props.city ?? ''),
      country: CustomerCountry.create(props.country ?? ''),
      customerType: CustomerType.create(props.customerType)
    })
  }

  static fromPrimitives(props: CustomerPrimitiveProps, contacts: ContactPrimitiveProps[] = []): Customer {
    return new Customer(
      CustomerId.create(props.id),
      SapId.create(props.sapId),
      CustomerName.create(props.name),
      TaxId.create(props.taxId),
      CustomerIndustry.create(props.industry),
      CustomerAddress.create(props.address),
      Phone.create(props.phone),
      CustomerNotes.create(props.notes),
      CustomerCity.create(props.city ?? ''),
      CustomerCountry.create(props.country ?? ''),
      CustomerType.create(props.customerType),
      contacts.map(Contact.fromPrimitives),
      props.status ? CustomerStatus.create(props.status) : CustomerStatus.create('active'),
      props.archivedAt ? SyncTimestamp.fromISOString(props.archivedAt) : null,
      props.lastSeenInSyncAt ? SyncTimestamp.fromISOString(props.lastSeenInSyncAt) : null,
      props.version
    )
  }

  toPrimitives(): CustomerPrimitiveProps {
    return {
      id: this._id.value,
      sapId: this._sapId.value,
      name: this._name.value,
      taxId: this._taxId.value,
      industry: this._industry.value,
      address: this._address.value,
      phone: this._phone.value,
      notes: this._notes.value,
      city: this._city.value,
      country: this._country.value,
      customerType: this._customerType.value,
      status: this._status.value,
      archivedAt: this._archivedAt?.toISOString() ?? null,
      lastSeenInSyncAt: this._lastSeenInSyncAt?.toISOString() ?? null,
      version: this._version
    }
  }

  updateDetails(updates: CustomerUpdateProps): void {
    if (updates.sapId !== undefined) {
      this._sapId = SapId.create(updates.sapId)
    }
    if (updates.name !== undefined) {
      this._name = CustomerName.create(updates.name)
    }
    if (updates.taxId !== undefined) {
      this._taxId = TaxId.create(updates.taxId)
    }
    if (updates.industry !== undefined) {
      this._industry = CustomerIndustry.create(updates.industry)
    }
    if (updates.address !== undefined) {
      this._address = CustomerAddress.create(updates.address)
    }
    if (updates.phone !== undefined) {
      this._phone = Phone.create(updates.phone)
    }
    if (updates.notes !== undefined) {
      this._notes = CustomerNotes.create(updates.notes)
    }
    if (updates.city !== undefined) {
      this._city = CustomerCity.create(updates.city)
    }
    if (updates.country !== undefined) {
      this._country = CustomerCountry.create(updates.country)
    }
    if (updates.customerType !== undefined) {
      this._customerType = CustomerType.create(updates.customerType)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Customer)) {
      return false
    }
    return this._id.equals(other._id)
  }

  hasTaxId(): boolean {
    return !this._taxId.isEmpty()
  }

  newSapIdIfChanged(updates: CustomerUniquenessUpdateProps): Undefinable<SapId> {
    if (!updates.sapId) {
      return
    }

    const newSapId = SapId.create(updates.sapId)

    if (this._sapId.equals(newSapId)) {
      return
    }

    return newSapId
  }

  newTaxIdIfChanged(updates: CustomerUniquenessUpdateProps): Undefinable<TaxId> {
    if (!updates.taxId) {
      return
    }

    const newTaxId = TaxId.create(updates.taxId)

    if (this._taxId.equals(newTaxId)) {
      return
    }

    return newTaxId
  }

  addContact(props: NewContactProps): Contact {
    if (this._contacts.length >= CUSTOMER_CONSTRAINTS.MAX_CONTACTS) {
      throw new CustomerError(`A customer can have at most ${CUSTOMER_CONSTRAINTS.MAX_CONTACTS} contacts`)
    }

    const contact = Contact.fromPrimitives({ ...props, customerId: this._id.value })

    if (contact.isPrimary) {
      this.demoteCurrentPrimary(contact.id)
    }
    this._contacts.push(contact)

    return contact
  }

  updateContact(contactId: ContactId, updates: CustomerContactUpdateProps): Contact {
    const contact = this.findContactOrThrow(contactId)

    contact.updateDetails(updates)

    if (updates.isPrimary === true) {
      this.demoteCurrentPrimary(contactId)
      contact.markAsPrimary()
    }
    if (updates.isPrimary === false) {
      contact.unmarkAsPrimary()
    }

    return contact
  }

  removeContact(contactId: ContactId): Contact {
    const contact = this.findContactOrThrow(contactId)
    this._contacts.splice(this._contacts.indexOf(contact), 1)

    return contact
  }

  private demoteCurrentPrimary(promotedId: ContactId): void {
    const current = this._contacts.find(contact => contact.isPrimary && !contact.id.equals(promotedId))
    current?.unmarkAsPrimary()
  }

  private findContactOrThrow(contactId: ContactId): Contact {
    const contact = this._contacts.find(candidate => candidate.id.equals(contactId))

    if (!contact) {
      throw new EntityNotFoundError('Contact', contactId.value)
    }

    return contact
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
