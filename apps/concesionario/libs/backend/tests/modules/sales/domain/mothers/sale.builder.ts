import { v7 as uuidv7 } from 'uuid'
import { Sale } from '../../../../../src/contexts/dealership/modules/sales/domain/sale'
import { SalePrimitiveProps } from '../../../../../src/contexts/dealership/modules/sales/domain/sale-types'
import { PaymentMethod } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/payment-method.vo'
import { SaleAmount } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-amount.vo'
import { SaleClientLabel } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-client-label.vo'
import { SaleDate } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-date.vo'
import { SaleDiscount } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-discount.vo'
import { SaleReference } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-reference.vo'
import { SaleStatus } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-status.vo'
import { SaleVehicleLabel } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/sale-vehicle-label.vo'
import { Salesperson } from '../../../../../src/contexts/dealership/modules/sales/domain/value-objects/salesperson.vo'
import { SaleId } from '../../../../../src/contexts/shared/domain/value-objects/sales/sale-id.vo'

const randomReference = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

export class SaleBuilder {
  private props: SalePrimitiveProps = {
    id: uuidv7(),
    reference: randomReference(),
    saleDate: '2026-01-15',
    vehicleLabel: 'VehicleLabel 1',
    clientLabel: 'ClientLabel 1',
    salesperson: '',
    amount: 0,
    discount: 0,
    paymentMethod: 'cash',
    status: 'pending'
  }

  static aSale(): SaleBuilder {
    return new SaleBuilder()
  }

  withId(id: string): SaleBuilder {
    this.props.id = id
    return this
  }

  withReference(reference: string): SaleBuilder {
    this.props.reference = reference
    return this
  }

  withPaymentMethod(paymentMethod: string): SaleBuilder {
    this.props.paymentMethod = paymentMethod
    return this
  }

  withStatus(status: string): SaleBuilder {
    this.props.status = status
    return this
  }

  withProps(overrides?: Partial<SalePrimitiveProps>): SaleBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Sale {
    return Sale.create({
      id: SaleId.create(this.props.id),
      reference: SaleReference.create(this.props.reference),
      saleDate: SaleDate.create(this.props.saleDate),
      vehicleLabel: SaleVehicleLabel.create(this.props.vehicleLabel),
      clientLabel: SaleClientLabel.create(this.props.clientLabel),
      salesperson: Salesperson.create(this.props.salesperson),
      amount: SaleAmount.create(this.props.amount),
      discount: SaleDiscount.create(this.props.discount),
      paymentMethod: PaymentMethod.create(this.props.paymentMethod),
      status: SaleStatus.create(this.props.status)
    })
  }

  build(): Sale {
    return Sale.fromPrimitives(this.props)
  }
}
