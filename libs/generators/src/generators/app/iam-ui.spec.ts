import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * Spec 34: la UI de IAM. El backend de usuarios se emite entero con auth
 * (buscar, invitar, cambiar rol, desactivar, reactivar, logout) pero hasta esta
 * spec ningún componente lo consumía: sin pantalla de usuarios y sin cerrar sesión.
 */
describe('app generator — UI de IAM (spec 34)', () => {
  const snapshot = async (options: Parameters<typeof appGenerator>[1]): Promise<Map<string, string>> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    const files = new Map<string, string>()
    for (const change of tree.listChanges()) {
      files.set(change.path, change.content?.toString('utf-8') ?? '')
    }
    return files
  }

  const base = { name: 'demo', models: 'contract', skipInstall: true } as const

  let withAuth: Map<string, string>
  let open: Map<string, string>

  beforeAll(async () => {
    withAuth = await snapshot({ ...base, auth: 'single-tenant' })
    open = await snapshot(base)
  })

  describe('iam-labels (TASK-01)', () => {
    it('con auth emite las etiquetas de rol y estado en español', () => {
      const labels = withAuth.get('apps/demo/libs/frontend/src/domains/iam/iam-labels.ts')

      expect(labels).toBeDefined()
      expect(labels).toContain("'Administrador'")
      expect(labels).toContain('USER_ROLE_LABELS')
      expect(labels).toContain('USER_STATUS_LABELS')
      // los valores de dominio viajan en inglés; el import sale del alias compartido
      expect(labels).toContain("from '@app/shared/domain'")
    })

    it('el AuthService del kernel expone isAdmin (la nav de usuarios se oculta a los demás)', () => {
      const service = withAuth.get('apps/demo/libs/frontend/src/core/services/auth.service.ts')

      expect(service).toContain('readonly isAdmin')
      expect(service).toContain('UserRoleEnum.ADMIN')
    })
  })

  describe('invite-user-dialog (TASK-02)', () => {
    it('con auth emite el diálogo de invitación sobre los contratos UI neutrales', () => {
      const dialog = withAuth.get('apps/demo/libs/frontend/src/domains/iam/invite-user-dialog.component.ts')

      expect(dialog).toBeDefined()
      expect(dialog).toContain('InviteUserFormValue')
      // solo contratos neutrales: nada de helm, sirve a las dos pieles sin variante
      expect(dialog).not.toContain('@spartan-ng')
      expect(dialog).toContain('AppDialogContent')
      expect(dialog).toContain('AppSelect')
      // los tres roles asignables del dominio
      expect(dialog).toContain('UserRoleEnum.ADMIN')
      expect(dialog).toContain('UserRoleEnum.VIEWER')
    })
  })

  describe('users-list (TASK-03)', () => {
    it('con auth emite el listado de usuarios sobre el DataTable compartido', () => {
      const list = withAuth.get('apps/demo/libs/frontend/src/domains/iam/users-list.component.ts')

      expect(list).toBeDefined()
      expect(list).not.toContain('@spartan-ng')
      expect(list).toContain('DataTable')
      expect(list).toContain('UserService')
      // filtros de rol y estado + acciones de fila con visibilidad por estado
      expect(list).toContain('roleFilter')
      expect(list).toContain('statusFilter')
      expect(list).toContain("action: 'role'")
      expect(list).toContain("action: 'disable'")
      expect(list).toContain("action: 'reactivate'")
      // desactivar avisa del cierre de sesiones (canon de la referencia)
      expect(list).toContain('Se cerrarán sus sesiones')
    })
  })

  describe('cableado del shell y las rutas (TASK-04)', () => {
    it('con auth la ruta /users carga el listado de usuarios', () => {
      const routes = withAuth.get('apps/demo/apps/frontend-app/src/app.routes.ts')

      expect(routes).toContain("path: 'users'")
      expect(routes).toContain('users-list.component')
    })

    it('con auth el shell monta el pie de sesión (usuarios admin + logout)', () => {
      const shell = withAuth.get('apps/demo/apps/frontend-app/src/app.component.ts')
      const footer = withAuth.get('apps/demo/libs/frontend/src/domains/auth/session-footer.component.ts')

      expect(shell).toContain('SessionFooterComponent')
      expect(shell).toContain('<app-session-footer />')
      expect(footer).toContain('Cerrar sesión')
      expect(footer).toContain('isAdmin')
    })
  })

  it('sin auth no se emite nada de la UI de IAM', () => {
    expect([...open.keys()].some(f => f.includes('/domains/iam/'))).toBe(false)
  })

  it('sin auth el shell no monta el pie de sesión ni existe la ruta /users', () => {
    expect(open.get('apps/demo/apps/frontend-app/src/app.component.ts')).not.toContain('app-session-footer')
    expect(open.get('apps/demo/apps/frontend-app/src/app.routes.ts')).not.toContain("path: 'users'")
  })
})
