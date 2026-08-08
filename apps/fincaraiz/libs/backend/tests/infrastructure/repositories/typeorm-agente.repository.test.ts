import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmAgenteRepository } from '../../../src/contexts/fincaraiz/modules/agentes/infrastructure/persistence/typeorm/typeorm-agente.repository'
import { AgenteWithIdSpecification } from '../../../src/contexts/fincaraiz/modules/agentes/domain/specifications/agente-with-id.specification'
import { AgenteId } from '../../../src/contexts/shared/domain/value-objects/agentes/agente-id.vo'
import { AgenteMother } from '../../modules/agentes/domain/mothers/agente.mother'

let repository: TypeOrmAgenteRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmAgenteRepository)
})

describe('TypeOrmAgenteRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new agente and reads it back', async () => {
      const agente = AgenteMother.random()

      await repository.register(agente)
      const found = await repository.get(agente.id)

      expect(found?.toPrimitives()).toEqual(agente.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(AgenteId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the agente selected by criteria', async () => {
      const agente = AgenteMother.random()
      await repository.register(agente)

      const results = await repository.matching(AgenteWithIdSpecification.withId(agente.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(agente.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const agente = AgenteMother.random()
      await repository.register(agente)

      const spec = AgenteWithIdSpecification.withId(agente.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = AgenteWithIdSpecification.withId(AgenteId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('remove', () => {
    it('removes a persisted agente', async () => {
      const agente = AgenteMother.random()
      await repository.register(agente)

      await repository.remove(agente.id)

      expect(await repository.get(agente.id)).toBeNull()
    })
  })
})
