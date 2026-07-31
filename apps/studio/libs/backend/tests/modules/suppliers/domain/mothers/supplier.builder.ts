import { v7 as uuidv7 } from 'uuid'
import { Supplier } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/supplier'
import { SupplierPrimitiveProps } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/supplier-types'
import { LeadTimeDays } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/lead-time-days.vo'
import { SupplierCity } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-city.vo'
import { SupplierEmail } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-email.vo'
import { SupplierName } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-name.vo'
import { SupplierPhone } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-phone.vo'
import { SupplierTaxId } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/value-objects/supplier-tax-id.vo'
import { SupplierId } from '../../../../../src/contexts/shared/domain/value-objects/suppliers/supplier-id.vo'

const randomTaxId = (): string => String(Math.floor(1000000000 + Math.random() * 9000000000))

export class SupplierBuilder {
  private props: SupplierPrimitiveProps = {
    id: uuidv7(),
    name: 'Name 1',
    taxId: randomTaxId(),
    email: '',
    phone: '',
    city: '',
    leadTimeDays: 0
  }

  static aSupplier(): SupplierBuilder {
    return new SupplierBuilder()
  }

  withId(id: string): SupplierBuilder {
    this.props.id = id
    return this
  }

  withTaxId(taxId: string): SupplierBuilder {
    this.props.taxId = taxId
    return this
  }

  withProps(overrides?: Partial<SupplierPrimitiveProps>): SupplierBuilder {
    this.props = { ...this.props, ...overrides }
    return this
  }

  create(): Supplier {
    return Supplier.create({
      id: SupplierId.create(this.props.id),
      name: SupplierName.create(this.props.name),
      taxId: SupplierTaxId.create(this.props.taxId),
      email: SupplierEmail.create(this.props.email),
      phone: SupplierPhone.create(this.props.phone),
      city: SupplierCity.create(this.props.city),
      leadTimeDays: LeadTimeDays.create(this.props.leadTimeDays)
    })
  }

  build(): Supplier {
    return Supplier.fromPrimitives(this.props)
  }
}
