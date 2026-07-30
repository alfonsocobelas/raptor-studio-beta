import { Supplier } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/supplier'
import { SupplierPrimitiveProps } from '../../../../../src/contexts/warehouse/modules/suppliers/domain/supplier-types'
import { SupplierBuilder } from './supplier.builder'

export class SupplierMother {
  static random(): Supplier {
    return SupplierBuilder.aSupplier().build()
  }

  static randomList(count: number = 5): Supplier[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<SupplierPrimitiveProps>): Supplier {
    return SupplierBuilder.aSupplier().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<SupplierPrimitiveProps>): Supplier {
    return SupplierBuilder.aSupplier().withProps(overrides).build()
  }

  static withTaxId(taxId: string): Supplier {
    return SupplierBuilder.aSupplier().withTaxId(taxId).build()
  }

  static primitives(overrides?: Partial<SupplierPrimitiveProps>): SupplierPrimitiveProps {
    return SupplierBuilder.aSupplier().withProps(overrides).build().toPrimitives()
  }
}
