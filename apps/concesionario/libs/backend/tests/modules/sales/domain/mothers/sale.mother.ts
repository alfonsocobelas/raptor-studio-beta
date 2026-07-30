import { Sale } from '../../../../../src/contexts/dealership/modules/sales/domain/sale'
import { SalePrimitiveProps } from '../../../../../src/contexts/dealership/modules/sales/domain/sale-types'
import { SaleBuilder } from './sale.builder'

export class SaleMother {
  static random(): Sale {
    return SaleBuilder.aSale().build()
  }

  static randomList(count: number = 5): Sale[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<SalePrimitiveProps>): Sale {
    return SaleBuilder.aSale().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<SalePrimitiveProps>): Sale {
    return SaleBuilder.aSale().withProps(overrides).build()
  }

  static withReference(reference: string): Sale {
    return SaleBuilder.aSale().withReference(reference).build()
  }

  static primitives(overrides?: Partial<SalePrimitiveProps>): SalePrimitiveProps {
    return SaleBuilder.aSale().withProps(overrides).build().toPrimitives()
  }
}
