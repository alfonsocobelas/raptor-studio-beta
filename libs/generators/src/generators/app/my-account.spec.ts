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
})
