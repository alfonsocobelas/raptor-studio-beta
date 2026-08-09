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

  it('sin auth no se emite nada de la UI de IAM', () => {
    expect([...open.keys()].some(f => f.includes('/domains/iam/'))).toBe(false)
  })
})
