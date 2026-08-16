import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { defineResource, ResourceDefinition } from '@raptor/schema'
import { registerModels } from './models/registry'
import { renderEntrypoints } from './build-entrypoints'
import { resourceGenerator } from './resource'

/**
 * Spec 46 TASK-02: los @Roles(...) del CRUD y satélites salen de la matriz de accesos
 * (resolveAccess) calculados en generator.ts — las plantillas solo interpolan. Ausente =
 * política actual (el golden no se mueve); la matriz no-default ejercita las costuras:
 * view sin viewer, manage vacío («solo admin») y adjuntos con decoradores propios.
 */
const permit = (): ResourceDefinition =>
  defineResource({
    schemaVersion: 1,
    name: 'permit',
    plural: 'permits',
    context: 'works',
    schemaName: 'works',
    labels: { singular: 'Permiso', plural: 'Permisos', gender: 'm' },
    formSections: [{ id: 'general', title: 'Datos' }],
    attachments: true,
    detail: { title: 'name' },
    history: true,
    access: { view: ['user'], manage: [] },
    list: { features: { delete: true, import: true } },
    fields: {
      id: { type: 'uuid', pk: true },
      name: {
        type: 'string',
        required: true,
        vo: { name: 'PermitName', fieldName: 'Permit name' },
        table: { show: true, label: 'Nombre', minWidth: 200 },
        form: { control: 'text', label: 'Nombre', section: 'general' },
        query: { sortable: true, filterable: true, searchable: true },
        column: { type: 'varchar', length: 120 }
      }
    }
  })

describe('los @Roles calculados desde la matriz de accesos (spec 46)', () => {
  describe('con la matriz no-default (view sin viewer, manage vacío)', () => {
    let tree: Tree
    const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''

    beforeAll(async () => {
      registerModels([permit()])
      tree = createTreeWithEmptyWorkspace()
      await resourceGenerator(tree, { name: 'permit', directory: 'out' })
    })

    it('las lecturas llevan los roles de Ver: admin + user, sin viewer', () => {
      const controller = read('backend/infrastructure/entrypoints/permits.controller.ts')

      expect(controller).toMatch(/@Get\(\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
      expect(controller).toMatch(/@Get\('export'\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
      expect(controller).toMatch(/@Get\('deleted'\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
      expect(controller).toMatch(/@Get\(':id\/history'\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
      expect(controller).not.toContain('UserRoleEnum.VIEWER')
    })

    it('las escrituras con manage vacío quedan solo para admin', () => {
      const controller = read('backend/infrastructure/entrypoints/permits.controller.ts')

      expect(controller).toMatch(/@Post\(\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
      expect(controller).toMatch(/@Post\('import'\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
      expect(controller).toMatch(/@Put\(':id'\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
      expect(controller).toMatch(/@Delete\(':id'\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
      expect(controller).toMatch(/@Post\(':id\/restore'\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
    })

    it('los adjuntos declaran roles: lecturas de Ver, escrituras de Gestionar', () => {
      const controller = read('backend/infrastructure/attachments/permit-attachments.controller.ts')

      expect(controller).toMatch(/@Get\(\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
      expect(controller).toMatch(/@Get\(':id\/download'\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
      expect(controller).toMatch(/@Post\(\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
      expect(controller).toMatch(/@Delete\(':id'\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
    })
  })

  describe('ausente = política actual (el golden no se mueve)', () => {
    let tree: Tree
    const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''

    beforeAll(async () => {
      tree = createTreeWithEmptyWorkspace()
      await resourceGenerator(tree, { name: 'project', directory: 'out' })
    })

    it('lecturas abiertas a viewer y escrituras admin+user, como hoy', () => {
      const controller = read('backend/infrastructure/entrypoints/projects.controller.ts')

      expect(controller).toMatch(/@Get\(\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER, UserRoleEnum\.VIEWER\)/)
      expect(controller).toMatch(/@Post\(\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
    })

    it('los adjuntos sin matriz siguen sin decoradores', () => {
      const controller = read('backend/infrastructure/attachments/project-attachments.controller.ts')

      expect(controller).not.toContain('@Roles')
    })
  })

  describe('renderEntrypoints calcula las cadenas (plantillas tontas)', () => {
    it('mapea la matriz a UserRoleEnum con admin siempre primero', () => {
      const entry = renderEntrypoints(permit(), true)

      expect(entry.readRoles).toBe('UserRoleEnum.ADMIN, UserRoleEnum.USER')
      expect(entry.writeRoles).toBe('UserRoleEnum.ADMIN')
      expect(entry.accessDeclared).toBe(true)
    })

    it('sin access resuelve la política actual', () => {
      const definition = permit()
      const entry = renderEntrypoints({ ...definition, access: undefined }, true)

      expect(entry.readRoles).toBe('UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER')
      expect(entry.writeRoles).toBe('UserRoleEnum.ADMIN, UserRoleEnum.USER')
      expect(entry.accessDeclared).toBe(false)
    })
  })
})
