import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { MongooseContractRepository } from '../../../src/contexts/sap-licensing/modules/contracts/infrastructure/persistence/mongoose/mongoose-contract.repository'
import { ContractWithIdSpecification } from '../../../src/contexts/sap-licensing/modules/contracts/domain/specifications/contract-with-id.specification'
import { ConcurrencyConflictError } from '../../../src/contexts/shared/domain/errors'
import { ContractId } from '../../../src/contexts/shared/domain/value-objects/contracts/contract-id.vo'
import { DeleteOperationId } from '../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { ContractNumber } from '../../../src/contexts/sap-licensing/shared/domain/value-objects/contract-number.vo'
import { ContractMother } from '../../modules/contracts/domain/mothers/contract.mother'

let repository: MongooseContractRepository

beforeAll(() => {
  repository = moduleFixture.get(MongooseContractRepository)
})

// Espejo del test de integración TypeORM: mismo puerto, mismas garantías. Corre contra un
// Mongo real (el del compose de test), no contra un doble.
describe('MongooseContractRepository (integration)', () => {
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

    it('dos saves sobre la misma versión leída: el primero gana, el segundo choca con 409 (spec 78)', async () => {
      const contract = ContractMother.random()
      await repository.register(contract)

      const firstReader = await repository.get(contract.id)
      const secondReader = await repository.get(contract.id)

      await repository.save(firstReader!)
      await expect(repository.save(secondReader!)).rejects.toThrow(ConcurrencyConflictError)

      const persisted = await repository.get(contract.id)
      expect(persisted?.version).toBe(2)
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

    it('exists / count reflect the persisted documents', async () => {
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

  describe('aggregate (spec 71)', () => {
    it('agrega el conjunto filtrado, y el vacío no responde lo mismo en todas las operaciones', async () => {
      const contract = ContractMother.random()
      await repository.register(contract)

      const spec = ContractWithIdSpecification.withId(contract.id)
      const value = contract.toPrimitives().nbrOfContracts

      expect(await repository.aggregate(spec, 'sum', 'nbrOfContracts')).toBe(value)
      expect(await repository.aggregate(spec, 'avg', 'nbrOfContracts')).toBe(value)
      expect(await repository.aggregate(spec, 'max', 'nbrOfContracts')).toBe(value)
      expect(await repository.aggregate(spec, 'min', 'nbrOfContracts')).toBe(value)
      expect(await repository.aggregate(spec, 'distinct', 'nbrOfContracts')).toBe(1)

      const absent = ContractWithIdSpecification.withId(ContractId.create(uuidv7()))
      // la suma de nada es 0 y los distintos de nada son 0…
      expect(await repository.aggregate(absent, 'sum', 'nbrOfContracts')).toBe(0)
      expect(await repository.aggregate(absent, 'distinct', 'nbrOfContracts')).toBe(0)
      // …pero la media, el máximo y el mínimo de nada NO son 0: son «no hay dato»
      expect(await repository.aggregate(absent, 'avg', 'nbrOfContracts')).toBeNull()
      expect(await repository.aggregate(absent, 'max', 'nbrOfContracts')).toBeNull()
      expect(await repository.aggregate(absent, 'min', 'nbrOfContracts')).toBeNull()
    })

    it('devuelve un número, no la cadena que el motor pueda dar por un numeric', async () => {
      const contract = ContractMother.random()
      await repository.register(contract)

      const sum = await repository.aggregate(ContractWithIdSpecification.withId(contract.id), 'sum', 'nbrOfContracts')

      expect(typeof sum).toBe('number')
    })
  })

  describe('aggregateGrouped (spec 72)', () => {
    it('desglosa en UNA consulta, con su clave y su valor', async () => {
      const contract = ContractMother.random()
      await repository.register(contract)

      const groups = await repository.aggregateGrouped(ContractWithIdSpecification.withId(contract.id), {
        op: 'count',
        groupBy: 'contractType',
        limit: 50
      })

      expect(groups).toHaveLength(1)
      expect(groups[0].key).toBe(String(contract.toPrimitives().contractType))
      expect(groups[0].value).toBe(1)
    })

    it('un conjunto vacío no tiene grupos: no los inventa a 0', async () => {
      const groups = await repository.aggregateGrouped(
        ContractWithIdSpecification.withId(ContractId.create(uuidv7())),
        { op: 'count', groupBy: 'contractType', limit: 50 }
      )

      expect(groups).toEqual([])
    })

    it('agrupa por mes con la clave YYYY-MM', async () => {
      const contract = ContractMother.random()
      await repository.register(contract)

      const groups = await repository.aggregateGrouped(ContractWithIdSpecification.withId(contract.id), {
        op: 'count',
        bucketField: 'startDate',
        limit: 50
      })

      // los meses vacíos los rellena el caso de uso: aquí solo vuelven los que tienen datos.
      // Un registro SIN fecha cae en el grupo '' (groupKeyOf(null)): también es contrato.
      for (const group of groups) {
        if (group.key !== '') expect(group.key).toMatch(/^\d{4}-\d{2}$/)
      }
    })
  })

  describe('save', () => {
    it('replaces the whole document instead of inserting a second one', async () => {
      const contract = ContractMother.random()
      await repository.register(contract)

      await repository.save(contract)

      expect(await repository.count(ContractWithIdSpecification.withId(contract.id))).toBe(1)
    })
  })
})
