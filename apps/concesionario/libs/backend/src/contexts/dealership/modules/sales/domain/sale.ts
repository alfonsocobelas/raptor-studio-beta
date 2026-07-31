import { AggregateRoot } from '../../../../shared/domain/aggregate-root'
import { Nullable, Undefinable } from '../../../../shared/domain/types'
import { SaleId } from '../../../../shared/domain/value-objects/sales/sale-id.vo'
import {
  RegisterSaleProps,
  SaleAggregateProps,
  SalePrimitiveProps,
  SaleUniquenessUpdateProps,
  SaleUpdateProps
} from './sale-types'
import { PaymentMethod } from './value-objects/payment-method.vo'
import { SaleAmount } from './value-objects/sale-amount.vo'
import { SaleClientLabel } from './value-objects/sale-client-label.vo'
import { SaleDate } from './value-objects/sale-date.vo'
import { SaleDiscount } from './value-objects/sale-discount.vo'
import { SaleReference } from './value-objects/sale-reference.vo'
import { SaleStatus } from './value-objects/sale-status.vo'
import { SaleVehicleLabel } from './value-objects/sale-vehicle-label.vo'
import { Salesperson } from './value-objects/salesperson.vo'

export class Sale extends AggregateRoot {
  private constructor(
    private readonly _id: SaleId,
    private _reference: SaleReference,
    private _saleDate: SaleDate,
    private _vehicleLabel: SaleVehicleLabel,
    private _clientLabel: SaleClientLabel,
    private _salesperson: Salesperson,
    private _amount: SaleAmount,
    private _discount: SaleDiscount,
    private _paymentMethod: PaymentMethod,
    private _status: SaleStatus
  ) {
    super()
  }

  //#region ...Getters...
  get id(): SaleId {
    return this._id
  }
  get reference(): SaleReference {
    return this._reference
  }
  get saleDate(): SaleDate {
    return this._saleDate
  }
  get vehicleLabel(): SaleVehicleLabel {
    return this._vehicleLabel
  }
  get clientLabel(): SaleClientLabel {
    return this._clientLabel
  }
  get salesperson(): Salesperson {
    return this._salesperson
  }
  get amount(): SaleAmount {
    return this._amount
  }
  get discount(): SaleDiscount {
    return this._discount
  }
  get paymentMethod(): PaymentMethod {
    return this._paymentMethod
  }
  get status(): SaleStatus {
    return this._status
  }
  //#endregion

  static create(props: SaleAggregateProps): Sale {
    return new Sale(
      props.id,
      props.reference,
      props.saleDate,
      props.vehicleLabel,
      props.clientLabel,
      props.salesperson,
      props.amount,
      props.discount,
      props.paymentMethod,
      props.status
    )
  }

  static register(props: RegisterSaleProps): Sale {
    return Sale.create({
      id: SaleId.create(props.id),
      reference: SaleReference.create(props.reference),
      saleDate: SaleDate.create(props.saleDate),
      vehicleLabel: SaleVehicleLabel.create(props.vehicleLabel),
      clientLabel: SaleClientLabel.create(props.clientLabel),
      salesperson: Salesperson.create(props.salesperson ?? ''),
      amount: SaleAmount.create(props.amount),
      discount: SaleDiscount.create(props.discount ?? 0),
      paymentMethod: PaymentMethod.create(props.paymentMethod),
      status: SaleStatus.create(props.status)
    })
  }

  static fromPrimitives(props: SalePrimitiveProps): Sale {
    return new Sale(
      SaleId.create(props.id),
      SaleReference.create(props.reference),
      SaleDate.create(props.saleDate),
      SaleVehicleLabel.create(props.vehicleLabel),
      SaleClientLabel.create(props.clientLabel),
      Salesperson.create(props.salesperson),
      SaleAmount.create(props.amount),
      SaleDiscount.create(props.discount),
      PaymentMethod.create(props.paymentMethod),
      SaleStatus.create(props.status)
    )
  }

  toPrimitives(): SalePrimitiveProps {
    return {
      id: this._id.value,
      reference: this._reference.value,
      saleDate: this._saleDate.value,
      vehicleLabel: this._vehicleLabel.value,
      clientLabel: this._clientLabel.value,
      salesperson: this._salesperson.value,
      amount: this._amount.value,
      discount: this._discount.value,
      paymentMethod: this._paymentMethod.value,
      status: this._status.value
    }
  }

  updateDetails(updates: SaleUpdateProps): void {
    if (updates.reference !== undefined) {
      this._reference = SaleReference.create(updates.reference)
    }
    if (updates.saleDate !== undefined) {
      this._saleDate = SaleDate.create(updates.saleDate)
    }
    if (updates.vehicleLabel !== undefined) {
      this._vehicleLabel = SaleVehicleLabel.create(updates.vehicleLabel)
    }
    if (updates.clientLabel !== undefined) {
      this._clientLabel = SaleClientLabel.create(updates.clientLabel)
    }
    if (updates.salesperson !== undefined) {
      this._salesperson = Salesperson.create(updates.salesperson)
    }
    if (updates.amount !== undefined) {
      this._amount = SaleAmount.create(updates.amount)
    }
    if (updates.discount !== undefined) {
      this._discount = SaleDiscount.create(updates.discount)
    }
    if (updates.paymentMethod !== undefined) {
      this._paymentMethod = PaymentMethod.create(updates.paymentMethod)
    }
    if (updates.status !== undefined) {
      this._status = SaleStatus.create(updates.status)
    }
  }

  equals(other: AggregateRoot): boolean {
    if (!(other instanceof Sale)) {
      return false
    }
    return this._id.equals(other._id)
  }

  newReferenceIfChanged(updates: SaleUniquenessUpdateProps): Undefinable<SaleReference> {
    if (!updates.reference) {
      return
    }

    const newReference = SaleReference.create(updates.reference)

    if (this._reference.equals(newReference)) {
      return
    }

    return newReference
  }

  // @ai:begin domain-extra — métodos de negocio no derivables del schema
  // @ai:end
}
