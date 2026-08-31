import { v7 as uuidv7 } from 'uuid'
import { moduleFixture } from '../jest.setup.integration'
import { TypeOrmProjectRepository } from '../../../src/contexts/sap-licensing/modules/projects/infrastructure/persistence/typeorm/typeorm-project.repository'
import { ProjectWithIdSpecification } from '../../../src/contexts/sap-licensing/modules/projects/domain/specifications/project-with-id.specification'
import { ConcurrencyConflictError } from '../../../src/contexts/shared/domain/errors'
import { ProjectId } from '../../../src/contexts/shared/domain/value-objects/projects/project-id.vo'
import { DeleteOperationId } from '../../../src/contexts/shared/domain/value-objects/delete-operation-id.vo'
import { ProjectName } from '../../../src/contexts/sap-licensing/modules/projects/domain/value-objects/project-name.vo'
import { ProjectMother } from '../../modules/projects/domain/mothers/project.mother'

let repository: TypeOrmProjectRepository

beforeAll(() => {
  repository = moduleFixture.get(TypeOrmProjectRepository)
})

describe('TypeOrmProjectRepository (integration)', () => {
  describe('register / get', () => {
    it('persists a new project and reads it back', async () => {
      const project = ProjectMother.random()

      await repository.register(project)
      const found = await repository.get(project.id)

      expect(found?.toPrimitives()).toEqual(project.toPrimitives())
    })

    it('returns null for a non-existent id', async () => {
      const found = await repository.get(ProjectId.create(uuidv7()))
      expect(found).toBeNull()
    })
  })

  describe('save — bloqueo optimista (spec 78)', () => {
    it('dos saves sobre la misma versión leída: el primero gana, el segundo choca con 409', async () => {
      const project = ProjectMother.random()
      await repository.register(project)

      const firstReader = await repository.get(project.id)
      const secondReader = await repository.get(project.id)

      await repository.save(firstReader!)
      await expect(repository.save(secondReader!)).rejects.toThrow(ConcurrencyConflictError)

      const persisted = await repository.get(project.id)
      expect(persisted?.version).toBe(2)
    })
  })

  describe('findByName', () => {
    it('finds a persisted project by its name', async () => {
      const project = ProjectMother.random()
      await repository.register(project)

      const found = await repository.findByName(ProjectName.create(project.toPrimitives().name))

      expect(found?.toPrimitives()).toEqual(project.toPrimitives())
    })

    it('returns null when no project has that name', async () => {
      // los valores de la mother son aleatorios: este nunca se registró
      const unregistered = ProjectMother.random()

      const found = await repository.findByName(ProjectName.create(unregistered.toPrimitives().name))

      expect(found).toBeNull()
    })
  })

  describe('matching / exists / count', () => {
    it('matching returns the project selected by criteria', async () => {
      const project = ProjectMother.random()
      await repository.register(project)

      const results = await repository.matching(ProjectWithIdSpecification.withId(project.id))

      expect(results).toHaveLength(1)
      expect(results[0].toPrimitives()).toEqual(project.toPrimitives())
    })

    it('exists / count reflect the persisted rows', async () => {
      const project = ProjectMother.random()
      await repository.register(project)

      const spec = ProjectWithIdSpecification.withId(project.id)
      expect(await repository.exists(spec)).toBe(true)
      expect(await repository.count(spec)).toBe(1)

      const absent = ProjectWithIdSpecification.withId(ProjectId.create(uuidv7()))
      expect(await repository.exists(absent)).toBe(false)
      expect(await repository.count(absent)).toBe(0)
    })
  })

  describe('aggregateGrouped (spec 72)', () => {
    it('desglosa en UNA consulta, con su clave y su valor', async () => {
      const project = ProjectMother.random()
      await repository.register(project)

      const groups = await repository.aggregateGrouped(ProjectWithIdSpecification.withId(project.id), {
        op: 'count',
        groupBy: 'customerId',
        limit: 50
      })

      expect(groups).toHaveLength(1)
      expect(groups[0].key).toBe(String(project.toPrimitives().customerId))
      expect(groups[0].value).toBe(1)
    })

    it('un conjunto vacío no tiene grupos: no los inventa a 0', async () => {
      const groups = await repository.aggregateGrouped(ProjectWithIdSpecification.withId(ProjectId.create(uuidv7())), {
        op: 'count',
        groupBy: 'customerId',
        limit: 50
      })

      expect(groups).toEqual([])
    })

    it('agrupa por mes con la clave YYYY-MM', async () => {
      const project = ProjectMother.random()
      await repository.register(project)

      const groups = await repository.aggregateGrouped(ProjectWithIdSpecification.withId(project.id), {
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

  describe('remove', () => {
    it('removes a persisted project', async () => {
      const project = ProjectMother.random()
      await repository.register(project)

      await repository.remove(project.id, DeleteOperationId.random())

      expect(await repository.get(project.id)).toBeNull()
    })
  })
})
