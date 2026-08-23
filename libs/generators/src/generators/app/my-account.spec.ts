import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * Spec 56: rescate de la pantalla "Mi cuenta". El backend siempre tuvo
 * POST /auth/change-password; esto le da contrato compartido, método en el
 * AuthService del kernel y pantalla en las apps con auth.
 */
describe('app generator — mi cuenta', () => {
  const generate = async (options: Parameters<typeof appGenerator>[1]): Promise<Tree> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, options)
    return tree
  }

  const base = { name: 'demo', models: 'contract', skipInstall: true } as const

  it('el contrato ChangePasswordDto y el método del service se emiten SIEMPRE (patrón resetPassword)', async () => {
    const tree = await generate(base)

    expect(tree.read('apps/demo/libs/shared/domain/src/auth/change-password.dto.ts', 'utf-8') ?? '').toContain(
      'ChangePasswordDto'
    )
    expect(tree.read('apps/demo/libs/shared/domain/src/index.ts', 'utf-8') ?? '').toContain(
      "./auth/change-password.dto"
    )
    const service = tree.read('apps/demo/libs/frontend/src/core/services/auth.service.ts', 'utf-8') ?? ''
    expect(service).toContain('changePassword(dto: ChangePasswordDto)')
    expect(service).toContain('auth/change-password')
  })

  describe('con auth single-tenant', () => {
    let tree: Tree

    beforeAll(async () => {
      tree = await generate({ ...base, auth: 'single-tenant' })
    })

    it('emite la pantalla Mi cuenta con su test, sin imports de la librería de componentes (ADR-003)', () => {
      const component = tree.read('apps/demo/libs/frontend/src/domains/iam/profile.component.ts', 'utf-8') ?? ''

      expect(component).toContain('Mi cuenta')
      expect(component).toContain('changePassword')
      expect(component).not.toContain('@spartan-ng')
      expect(tree.exists('apps/demo/libs/frontend/src/domains/iam/profile.component.spec.ts')).toBe(true)
    })

    it('cablea la ruta /account en el frontend', () => {
      const routes = tree.read('apps/demo/apps/frontend-app/src/app.routes.ts', 'utf-8') ?? ''

      expect(routes).toContain("path: 'account'")
      expect(routes).toContain('ProfileComponent')
    })

    it('el pie de sesión enlaza a /account desde el bloque del usuario', () => {
      const footer = tree.read('apps/demo/libs/frontend/src/domains/auth/session-footer.component.ts', 'utf-8') ?? ''

      expect(footer).toContain('/account')
    })
  })

  it('sin auth no existe ni la pantalla ni la ruta', async () => {
    const tree = await generate(base)

    expect(tree.exists('apps/demo/libs/frontend/src/domains/iam/profile.component.ts')).toBe(false)
    expect(tree.read('apps/demo/apps/frontend-app/src/app.routes.ts', 'utf-8') ?? '').not.toContain("path: 'account'")
  })
})
