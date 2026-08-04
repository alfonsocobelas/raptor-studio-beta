import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from './app'

/**
 * TASK-03 (spec 26): el `seed.ts` emitido importaba el seeder, las fixtures y el register use case
 * de TODOS los modelos, aunque un modelo no escriba y por tanto no tenga ninguna de esas piezas
 * emitidas — `license` es el caso. Otra vez el generador emitiendo imports de lo que él mismo
 * decidió no emitir.
 */
describe('app generator — el seed sólo importa lo que existe', () => {
  const seedOf = async (models: string): Promise<string> => {
    const tree: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models, skipInstall: true })
    return tree.read('apps/demo/libs/backend/src/seed.ts', 'utf-8') ?? ''
  }

  it('no importa el seeder de un modelo que no escribe (license)', async () => {
    const seed = await seedOf('contract,license')

    expect(seed).not.toContain('LicenseLocalSeeder')
    expect(seed).not.toContain('RegisterLicenseUseCase')
    expect(seed).not.toContain('licenses/infrastructure/seed/local-seed.fixtures')
  })

  it('sí importa el de los modelos que lo tienen', async () => {
    const seed = await seedOf('contract,license')

    expect(seed).toContain('ContractLocalSeeder')
    expect(seed).toContain('RegisterContractUseCase')
  })

  it('tampoco registra su módulo ni su siembra', async () => {
    const seed = await seedOf('contract,license')

    expect(seed).not.toContain('LicensesModule')
    expect(seed).not.toMatch(/licensesSummary/)
  })
})
