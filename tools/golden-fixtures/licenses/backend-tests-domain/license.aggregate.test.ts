import { License } from '../../../../src/contexts/sap-licensing/modules/licenses/domain/license'
import { LicenseMother } from './mothers/license.mother'

describe('License', () => {
  /**
   * El mapeo es lo que más se rompe al añadir un campo: si `toPrimitives` se olvida de uno,
   * o `fromPrimitives` lo pierde por el camino, el redondeo deja de cerrar.
   */
  it('round-trips through primitives without losing fields', () => {
    const primitives = LicenseMother.primitives()

    expect(License.fromPrimitives(primitives).toPrimitives()).toEqual(primitives)
  })
})
