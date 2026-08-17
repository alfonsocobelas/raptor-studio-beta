import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'
import { INFRA } from './registry'
import { SLOTS } from '../plugins/slots'

/**
 * TASK-03 (spec 50): el proveedor raptor — Raptor Cloud, la composición low-cost. Los
 * secretos `vault.*` se resuelven contra Infisical por API REST (sin SDK: el emitido no
 * arrastra ningún cliente de nube para leer secretos).
 */
describe('proveedor infra=raptor', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'raptor' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('está registrado como proveedor elegible de la ranura, detrás de aws', () => {
    expect(Object.keys(INFRA)).toEqual(['none', 'azure', 'aws', 'raptor'])
    expect(SLOTS['infra'].providers.map(p => p.value)).toEqual(['none', 'azure', 'aws', 'raptor'])
  })

  it('emite el resolver de secretos de Infisical y su config loader', () => {
    expect(
      tree.exists(
        'apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/infisical/infisical-secret-resolver.ts'
      )
    ).toBe(true)
    expect(
      tree.exists(
        'apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/infisical/infisical-config-loader.ts'
      )
    ).toBe(true)
  })

  it('cambia el loader de config por el que resuelve vault.* contra Infisical', () => {
    const configModule = read('libs/backend/src/contexts/shared/infrastructure/config/config.module.ts')

    expect(configModule).toContain("from './loaders/infisical/infisical-config-loader'")
    expect(configModule).not.toContain("from './loaders/config-loader'")
  })

  it('el resolver usa la identidad de máquina y aplana vault.* en SCREAMING_SNAKE', () => {
    const resolver = read(
      'libs/backend/src/contexts/shared/infrastructure/config/loaders/infisical/infisical-secret-resolver.ts'
    )

    expect(resolver).toContain('INFISICAL_CLIENT_ID')
    expect(resolver).toContain('INFISICAL_PROJECT_ID')
    expect(resolver).toContain("replace(/\\./g, '_').toUpperCase()")
    expect(resolver).toContain('SecretResolutionError')
  })

  it('no arrastra ningún SDK para leer secretos: habla HTTP con el fetch de la plataforma', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }
    const resolver = read(
      'libs/backend/src/contexts/shared/infrastructure/config/loaders/infisical/infisical-secret-resolver.ts'
    )

    expect(Object.keys(pkg.dependencies).filter(name => name.includes('infisical'))).toEqual([])
    expect(resolver).not.toContain("from '@infisical/")
  })

  it('no filtra el secreto de la identidad en el error del login', () => {
    const resolver = read(
      'libs/backend/src/contexts/shared/infrastructure/config/loaders/infisical/infisical-secret-resolver.ts'
    )

    expect(resolver).not.toMatch(/message.*clientSecret/)
  })
})
