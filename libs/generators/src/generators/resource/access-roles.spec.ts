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
    access: { view: ['user'], manage: [], transitions: { approve: [] } },
    list: { features: { delete: true, import: true } },
    state: {
      field: 'status',
      initial: 'draft',
      transitions: [
        { name: 'approve', label: 'Aprobar', from: ['draft'], to: 'approved' },
        { name: 'reject', label: 'Rechazar', from: ['draft'], to: 'rejected' }
      ]
    },
    fields: {
      id: { type: 'uuid', pk: true },
      status: {
        type: 'string',
        vo: { name: 'PermitStatus', fieldName: 'Status', values: ['draft', 'approved', 'rejected'] }
      },
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

  describe('las transiciones usan transitionRoles[verbo] (TASK-03)', () => {
    let tree: Tree
    const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''

    beforeAll(async () => {
      registerModels([permit()])
      tree = createTreeWithEmptyWorkspace()
      await resourceGenerator(tree, { name: 'permit', directory: 'out' })
    })

    it('el endpoint de la transición declarada lleva sus roles («solo admin»)', () => {
      const controller = read('backend/infrastructure/entrypoints/permits.controller.ts')

      expect(controller).toMatch(/@Post\(':id\/approve'\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
    })

    it('la transición sin declarar lleva el defecto admin+user', () => {
      const controller = read('backend/infrastructure/entrypoints/permits.controller.ts')

      expect(controller).toMatch(/@Post\(':id\/reject'\)\s+@Roles\(UserRoleEnum\.ADMIN, UserRoleEnum\.USER\)/)
    })
  })

  describe('el paso de proceso convergido (spec 44) usa los roles de su transición', () => {
    it('el endpoint del paso lleva los roles del verbo que ejecuta', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { emitFlowProcesses } = require('../app/flow-process')
      const tree = createTreeWithEmptyWorkspace()
      tree.write('backend/root.module.ts', 'import { HealthModule } from "x"\nimports: [HealthModule,]\n')
      const flow = {
        name: 'De alta a aprobado',
        nodes: [
          { id: 'llega', kind: 'start', text: 'Llega el permiso' },
          { id: 'aprueba', kind: 'step', text: 'Se aprueba', entity: 'permit', transition: 'approve' },
          { id: 'fin', kind: 'end', text: 'Aprobado' }
        ],
        edges: [
          { from: 'llega', to: 'aprueba' },
          { from: 'aprueba', to: 'fin' }
        ]
      }
      emitFlowProcesses(tree, 'backend', [flow], [permit()])

      const controller =
        tree.read('backend/contexts/works/processes/de-alta-a-aprobado/de-alta-a-aprobado.controller.ts', 'utf-8') ?? ''

      expect(controller).toMatch(/@Post\('aprueba\/:id'\)\s+@Roles\(UserRoleEnum\.ADMIN\)/)
    })
  })

  describe('el frontend condicionado por rol (TASK-04)', () => {
    let tree: Tree
    const read = (path: string): string => tree.read(`out/${path}`, 'utf-8') ?? ''

    beforeAll(async () => {
      registerModels([permit()])
      tree = createTreeWithEmptyWorkspace()
      await resourceGenerator(tree, { name: 'permit', directory: 'out' })
    })

    it('emite las constantes de acceso del dominio desde la matriz', () => {
      const access = read('frontend/permit-access.ts')

      expect(access).toContain('export const CAN_MANAGE_ROLES: readonly UserRoleEnum[] = [UserRoleEnum.ADMIN]')
      expect(access).toContain("'approve': [UserRoleEnum.ADMIN]")
      expect(access).toContain("'reject': [UserRoleEnum.ADMIN, UserRoleEnum.USER]")
    })

    it('la lista deriva canWrite de CAN_MANAGE_ROLES (Nuevo/editar/borrar siguen)', () => {
      const list = read('frontend/permits-list.component.ts')

      expect(list).toContain("import { CAN_MANAGE_ROLES } from './permit-access'")
      expect(list).toContain('CAN_MANAGE_ROLES.includes(role)')
      expect(list).not.toContain('inject(AuthService).canWrite')
    })

    it('el botón de importar solo se pinta con Gestionar', () => {
      const list = read('frontend/permits-list.component.ts')

      expect(list).toMatch(/@if \(canWrite\(\)\) \{[\s\S]{0,400}data-testid="open-import"/)
    })

    it('la ficha condiciona cada botón de transición con sus roles', () => {
      const detail = read('frontend/permit-detail.component.ts')

      expect(detail).toContain("import { CAN_MANAGE_ROLES, TRANSITION_ROLES } from './permit-access'")
      expect(detail).toMatch(/@if \(canTransition\('approve'\) &&/)
      expect(detail).toMatch(/@if \(canTransition\('reject'\) &&/)
      expect(detail).toContain('TRANSITION_ROLES[verb]')
    })

    it('sin matriz no hay fichero de acceso y la lista sigue con AuthService.canWrite', async () => {
      const clean = createTreeWithEmptyWorkspace()
      await resourceGenerator(clean, { name: 'project', directory: 'out' })

      expect(clean.exists('out/frontend/project-access.ts')).toBe(false)
      expect(clean.read('out/frontend/projects-list.component.ts', 'utf-8')).toContain('inject(AuthService).canWrite')
    })
  })

  describe('renderEntrypoints calcula las cadenas (plantillas tontas)', () => {
    it('mapea la matriz a UserRoleEnum con admin siempre primero', () => {
      const entry = renderEntrypoints(permit(), true)

      expect(entry.readRoles).toBe('UserRoleEnum.ADMIN, UserRoleEnum.USER')
      expect(entry.writeRoles).toBe('UserRoleEnum.ADMIN')
      expect(entry.accessDeclared).toBe(true)
      expect(entry.transitions.map(t => [t.verb, t.roles])).toEqual([
        ['approve', 'UserRoleEnum.ADMIN'],
        ['reject', 'UserRoleEnum.ADMIN, UserRoleEnum.USER']
      ])
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
