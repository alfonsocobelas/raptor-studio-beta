import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { SupplierId } from '../../../../shared/domain/value-objects/suppliers/supplier-id.vo'
import {
  RegisterSupplierProps,
  SupplierAggregateProps,
  SupplierPrimitiveProps,
  SupplierUniquenessUpdateProps,
  SupplierUpdateProps
} from './supplier-types'
import { LeadTimeDays } from './value-objects/lead-time-days.vo'
import { SupplierCity } from './value-objects/supplier-city.vo'
import { SupplierEmail } from './value-objects/supplier-email.vo'
import { SupplierName } from './value-objects/supplier-name.vo'
import { SupplierPhone } from './value-objects/supplier-phone.vo'
import { SupplierTaxId } from './value-objects/supplier-tax-id.vo'

export class Supplier extends AggregateRoot {
  private constructor(
    private readonly _id: SupplierId,
    private _name: SupplierName,
    private _taxId: SupplierTaxId,
    private _email: SupplierEmail,
    private _phone: SupplierPhone,
    private _city: SupplierCity,
    private _leadTimeDays: LeadTimeDays
  ) {
    super()
  }

  //#region ...Getters...
  get id(): SupplierId {
    return this._id
  }
  get name(): SupplierName {
    return this._name
  }
  get taxId(): SupplierTaxId {
    return this._taxId
  }
  get email(): SupplierEmail {
    return this._email
  }
  get phone(): SupplierPhone {
    return this._phone
  }
  get city(): SupplierCity {
    return this._city
  }
  get leadTimeDays(): LeadTimeDays {
    return this._leadTimeDays
  }
  //#endregion

  static create(props: SupplierAggregateProps): Supplier {
    return new Supplier(props.id, props.name, props.taxId, props.email, props.phone, props.city, props.leadTimeDays)
  }

  static register(props: RegisterSupplierProps): Supplier {
    return Supplier.create({
      id: SupplierId.create(props.id),
      name: SupplierName.create(props.name),
      taxId: SupplierTaxId.create(props.taxId ?? ''),
      email: SupplierEmail.create(props.email ?? ''),
      phone: SupplierPhone.create(props.phone ?? ''),
      city: SupplierCity.create(props.city ?? ''),
      leadTimeDays: LeadTimeDays.create(props.leadTimeDays)
    })
  }

  static fromPrimitives(props: SupplierPrimitiveProps): Supplier {
    return new Supplier(
      SupplierId.create(props.id),
      SupplierName.create(props.name),
      SupplierTaxId.create(props.taxId),
      SupplierEmail.create(props.email),
      SupplierPhone.create(props.phone),
      SupplierCity.create(props.city),
      LeadTimeDays.create(props.leadTimeDays)
    )
  }

  toPrimitives(): SupplierPrimitiveProps {
    return {
      id: this._id.value,
      name: this._name.value,
      taxId: this._taxId.value,
      email: this._email.value,
      phone: this._phone.value,
      city: this._city.value,
      leadTimeDays: this._leadTimeDays.value
    }
  }

  updateDetails(updates: SupplierUpdateProps): void {
    if (updates.name !== undefined) {
      this._name = SupplierName.create(updates.name)
    }
    if (updates.taxId !== undefined) {
      this._taxId = SupplierTaxId.create(updates.taxId)
    }
    if (updates.email !== undefined) {
      this._email = SupplierEmail.create(updates.email)
    }
    if (updates.phone !== undefined) {
      this._phone = SupplierPhone.create(updates.phone)
    }
    if (updates.city !== undefined) {
      this._city = SupplierCity.create(updates.city)
    }
    if (updates.leadTimeDays !== undefined) {
      this._leadTimeDays = LeadTimeDays.create(updates.leadTimeDays)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Supplier)) {
      return false
    }
    return this._id.equals(other._id)
  }

  hasTaxId(): boolean {
    return !this._taxId.isEmpty()
  }

  newTaxIdIfChanged(updates: SupplierUniquenessUpdateProps): Undefinable<SupplierTaxId> {
    if (!updates.taxId) {
      return
    }

    const newTaxId = SupplierTaxId.create(updates.taxId)

    if (this._taxId.equals(newTaxId)) {
      return
    }

    return newTaxId
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
