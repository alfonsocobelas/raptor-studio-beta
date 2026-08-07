import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmContractRepository } from '../../../src/contexts/sap-licensing/modules/contracts/infrastructure/persistence/typeorm/typeorm-contract.repository'
import { ContractWithIdSpecification } from '../../../src/contexts/sap-licensing/modules/contracts/domain/specifications/contract-with-id.specification'
import { ContractId } from '../../../src/contexts/shared/domain/value-objects/contracts/contract-id.vo'
import { ContractNumber } from '../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-number.vo'
import { ContractMother } from '../../modules/contracts/domain/mothers/contract.mother'

let repository: TypeOrmContractRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmContractRepository)
})

describe('TypeOrmContractRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new contract and reads it back', async () => {
      const contract = ContractMother.random()

      await repository.register(contract)
      const found = await repository.get(contract.id)

      expect(found?.toPrimitives()).toEqual(contract.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(ContractId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('findByContractNumber', () => {
    it('finds a persisted contract by its contractNumber', async () => {
      const contract = ContractMother.random()
      await repository.register(contract)

      const found = await repository.findByContractNumber(
        ContractNumber.create(contract.toPrimitives().contractNumber ?? '')
      )

      expect(found?.toPrimitives()).toEqual(contract.toPrimitives())
    })

    it('returns null when no contract has that contractNumber', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = ContractMother.random()

      const found = await repository.findByContractNumber(
        ContractNumber.create(unregistered.toPrimitives().contractNumber ?? '')
      )

      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the contract selected by criteria', async () => {
      const contract = ContractMother.random()
      await repository.register(contract)

      const results = await repository.matching(ContractWithIdSpecification.withId(contract.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(contract.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const contract = ContractMother.random()
      await repository.register(contract)

      const spec = ContractWithIdSpecification.withId(contract.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = ContractWithIdSpecification.withId(ContractId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })
})
