import { Contract } from '../../../../src/contexts/sap-licensing/modules/contracts/domain/contract'
import { ContractMother } from './mothers/contract.mother'

describe('Contract', () => {
  /**
   * El mapeo es lo que más se rompe al añadir un campo: si `toPrimitives` se olvida de uno,
   * o `fromPrimitives` lo pierde por el camino, el redondeo deja de cerrar.
   */
  it('round-trips through primitives without losing fields', () => {
    const primitives = ContractMother.primitives()

    expect(Contract.fromPrimitives(primitives).toPrimitives()).toEqual(primitives)
  })

  describe('transitions', () => {
    it('terminate() moves it from active to terminated', () => {
      const contract = ContractMother.reconstruct({ status: 'active' })

      contract.terminate()

      expect(contract.toPrimitives().status).toBe('terminated')
    })

    it('terminate() is rejected from expired', () => {
      const contract = ContractMother.reconstruct({ status: 'expired' })

      expect(() => contract.terminate()).toThrow()
    })
    it('expire() moves it from expiring to expired', () => {
      const contract = ContractMother.reconstruct({ status: 'expiring' })

      contract.expire()

      expect(contract.toPrimitives().status).toBe('expired')
    })

    it('expire() is rejected from active', () => {
      const contract = ContractMother.reconstruct({ status: 'active' })

      expect(() => contract.expire()).toThrow()
    })
  })
})
