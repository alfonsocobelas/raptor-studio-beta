import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { defineResource, ResourceDefinition } from '@raptor/schema'
import { registerModels } from './models/registry'
import { resourceGenerator } from './resource'

/**
 * Spec 49 TASK-12: verificación de punta a punta de la granularidad. Con una matriz donde
 * crear ≠ editar ≠ borrar, los @Roles del backend y las constantes del frontend tienen que
 * decir EXACTAMENTE lo mismo capacidad a capacidad — si divergen, el usuario ve un botón
 * que el backend le va a negar con 403. Cubre también la variante sin borrar ni importar,
 * donde las constantes y los imports condicionales se recortan.
 */
const base = (over: Partial<ResourceDefinition>): ResourceDefinition =>
  defineResource({
    schemaVersion: 1,
    name: 'permit',
    plural: 'permits',
    context: 'works',
    schemaName: 'works',
    labels: { singular: 'Permiso', plural: 'Permisos', gender: 'm' },
    formSections: [{ id: 'general', title: 'Datos' }],
    detail: { title: 'name' },
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
    },
    ...over
  } as ResourceDefinition)

/** crear solo admin · editar admin+user · borrar admin+user+viewer: las tres distintas */
const granular = (): ResourceDefinition =>
  base({
    attachments: true,
    list: { features: { delete: true, import: true } },
    access: { view: ['user', 'viewer'], create: [], edit: ['user'], delete: ['user', 'viewer'] }
  })

/** sin borrar ni importar: las constantes y los imports se recortan a lo que se usa */
const readOnlyish = (): ResourceDefinition =>
  base({ access: { view: ['user', 'viewer'], create: ['user'], edit: ['user'], delete: [] } })

async function emit(definition: ResourceDefinition): Promise<(path: string) => string> {
  registerModels([definition])
  const tree: Tree = createTreeWithEmptyWorkspace()
  await resourceGenerator(tree, { name: definition.name, directory: 'out' })
  return (path: string) => tree.read(`out/${path}`, 'utf-8') ?? ''
}

describe('spec 49 — la granularidad llega coherente a la app emitida', () => {
  describe('con create ≠ edit ≠ delete', () => {
    let read: (path: string) => string

    beforeAll(async () => {
      read = await emit(granular())
    })

    it('el backend protege cada verbo con su capacidad', () => {
      const controller = read('backend/infrastructure/entrypoints/permits.controller.ts')

      expect(controller).toMatch(/@Post\(\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
      expect(controller).toMatch(/@Put\(':id'\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
      expect(controller).toMatch(
        /@Delete\(':id'\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER, UserRoleEnum\.VIEWER\)/
      )
    })

    it('el frontend declara las MISMAS listas de roles que el backend', () => {
      const access = read('frontend/permit-access.ts')

      expect(access).toContain('export const CAN_CREATE_ROLES: readonly UserRoleEnum[] = [UserRoleEnum.ADMIN]')
      expect(access).toContain(
        'export const CAN_EDIT_ROLES: readonly UserRoleEnum[] = [UserRoleEnum.ADMIN, UserRoleEnum.USER]'
      )
      expect(access).toContain(
        'export const CAN_DELETE_ROLES: readonly UserRoleEnum[] = [UserRoleEnum.ADMIN, UserRoleEnum.USER, UserRoleEnum.VIEWER]'
      )
    })

    it('ningún fichero emitido conserva la constante única de escritura', () => {
      for (const path of [
        'frontend/permit-access.ts',
        'frontend/permits-list.component.ts',
        'frontend/permits-trash.component.ts',
        'frontend/permit-detail.component.ts'
      ]) {
        expect(read(path)).not.toContain('CAN_MANAGE_ROLES')
      }
    })

    it('cada acción de la lista se pinta con su propia capacidad', () => {
      const list = read('frontend/permits-list.component.ts')

      expect(list).toContain('[showCreate]="canCreate()"')
      expect(list).toMatch(/@if \(canCreate\(\)\) \{[\s\S]{0,400}data-testid="open-import"/)
      expect(list).toMatch(/this\.canEdit\(\)[\s\S]{0,160}lucidePencil/)
      expect(list).toMatch(/this\.canDelete\(\)[\s\S]{0,160}lucideTrash2/)
      expect(list).toContain('CAN_CREATE_ROLES.includes(role)')
      expect(list).toContain('CAN_EDIT_ROLES.includes(role)')
      expect(list).toContain('CAN_DELETE_ROLES.includes(role)')
    })

    it('la papelera restaura con la capacidad de borrar', () => {
      const trash = read('frontend/permits-trash.component.ts')

      expect(trash).toContain("import { CAN_DELETE_ROLES } from './permit-access'")
      expect(trash).toContain('CAN_DELETE_ROLES.includes(role)')
    })

    it('los adjuntos escriben con la capacidad de editar', () => {
      const controller = read('backend/infrastructure/attachments/permit-attachments.controller.ts')

      expect(controller).toMatch(/@Post\(\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
      expect(controller).toMatch(/@Delete\(':id'\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
    })
  })

  describe('sin borrar ni importar', () => {
    let read: (path: string) => string

    beforeAll(async () => {
      read = await emit(readOnlyish())
    })

    it('la lista solo importa las constantes que usa', () => {
      const list = read('frontend/permits-list.component.ts')

      expect(list).toContain("import { CAN_CREATE_ROLES, CAN_EDIT_ROLES } from './permit-access'")
      expect(list).not.toContain('CAN_DELETE_ROLES')
    })

    it('la ficha solo importa las constantes que usa', () => {
      const detail = read('frontend/permit-detail.component.ts')

      expect(detail).toContain("import { CAN_EDIT_ROLES } from './permit-access'")
      expect(detail).not.toContain('CAN_DELETE_ROLES')
      expect(detail).not.toContain('TRANSITION_ROLES')
    })
  })
})
