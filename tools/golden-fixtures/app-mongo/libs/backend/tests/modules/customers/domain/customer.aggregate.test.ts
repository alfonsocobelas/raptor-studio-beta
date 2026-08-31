import { Customer } from '../../../../src/contexts/sap-licensing/modules/customers/domain/customer'
import { CustomerMother } from './mothers/customer.mother'

describe('Customer', () => {
  /**
   * El mapeo es lo que más se rompe al añadir un campo: si `toPrimitives` se olvida de uno,
   * o `fromPrimitives` lo pierde por el camino, el redondeo deja de cerrar.
   */
  it('round-trips through primitives without losing fields', () => {
    const primitives = CustomerMother.primitives()

    expect(Customer.fromPrimitives(primitives).toPrimitives()).toEqual(primitives)
  })
})
