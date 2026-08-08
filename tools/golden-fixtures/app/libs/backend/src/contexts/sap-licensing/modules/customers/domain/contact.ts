import { ContactAggregateProps, ContactPrimitiveProps, ContactUpdateProps } from './customer-types'
import { ContactEmail } from './value-objects/contact-email.vo'
import { ContactId } from './value-objects/contact-id.vo'
import { ContactName } from './value-objects/contact-name.vo'
import { ContactRole } from './value-objects/contact-role.vo'
import { CustomerId } from '../../../../shared/domain/value-objects/customers/customer-id.vo'
import { IsPrimary } from './value-objects/is-primary.vo'
import { Phone } from '../../../shared/domain/value-objects/phone.vo'

export class Contact {
  private constructor(
    private readonly _id: ContactId,
    private readonly _customerId: CustomerId,
    private _name: ContactName,
    private _role: ContactRole,
    private _email: ContactEmail,
    private _phone: Phone,
    private _isPrimary: IsPrimary
  ) {}

  //#region ...Getters...
  get id(): ContactId {
    return this._id
  }
  get customerId(): CustomerId {
    return this._customerId
  }
  get name(): ContactName {
    return this._name
  }
  get role(): ContactRole {
    return this._role
  }
  get email(): ContactEmail {
    return this._email
  }
  get phone(): Phone {
    return this._phone
  }
  get isPrimary(): boolean {
    return this._isPrimary.value
  }
  //#endregion

  static create(props: ContactAggregateProps): Contact {
    return new Contact(props.id, props.customerId, props.name, props.role, props.email, props.phone, props.isPrimary)
  }

  static fromPrimitives(props: ContactPrimitiveProps): Contact {
    return new Contact(
      ContactId.create(props.id),
      CustomerId.create(props.customerId),
      ContactName.create(props.name),
      ContactRole.create(props.role),
      ContactEmail.create(props.email),
      Phone.create(props.phone),
      IsPrimary.create(props.isPrimary)
    )
  }

  toPrimitives(): ContactPrimitiveProps {
    return {
      id: this._id.value,
      customerId: this._customerId.value,
      name: this._name.value,
      role: this._role.value,
      email: this._email.value,
      phone: this._phone.value,
      isPrimary: this._isPrimary.value
    }
  }

  updateDetails(updates: ContactUpdateProps): void {
    if (updates.name !== undefined) {
      this._name = ContactName.create(updates.name)
    }
    if (updates.role !== undefined) {
      this._role = ContactRole.create(updates.role)
    }
    if (updates.email !== undefined) {
      this._email = ContactEmail.create(updates.email)
    }
    if (updates.phone !== undefined) {
      this._phone = Phone.create(updates.phone)
    }
  }

  markAsPrimary(): void {
    this._isPrimary = IsPrimary.create(true)
  }

  unmarkAsPrimary(): void {
    this._isPrimary = IsPrimary.create(false)
  }
}
