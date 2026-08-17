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

  /**
   * TASK-04: los ficheros van a Cloudflare R2, que habla S3 — así que el adapter es el MISMO
   * que emite aws, con `endpoint` y `forcePathStyle` puestos. Es el reuso que justifica no
   * escribir un adapter nuevo: R2, Backblaze B2 y MinIO caben en la misma sección de config.
   */
  describe('storage', () => {
    const STORAGE_MODULE = 'apps/demo/libs/backend/src/contexts/shared/infrastructure/storage/storage.module.ts'

    const context = {
      root: 'apps/demo',
      appName: 'demo',
      backendSrc: 'apps/demo/libs/backend/src',
      frontendSrc: 'apps/demo/libs/frontend/src',
      models: [],
      scope: '@app'
    }

    it('emite el adapter S3 y declara su SDK (el único cliente de nube de este proveedor)', () => {
      expect(tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/storage/s3-file-storage.ts')).toBe(
        true
      )
      const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }
      expect(pkg.dependencies['@aws-sdk/client-s3']).toBeDefined()
    })

    it('la sección storage lleva endpoint y forcePathStyle: R2 no es AWS', () => {
      const types = read('libs/backend/src/contexts/shared/infrastructure/config/config-types.ts')
      const validation = read('libs/backend/src/contexts/shared/infrastructure/config/config-validation.ts')

      expect(types).toContain('bucket: string')
      expect(types).toContain('endpoint?: string')
      expect(types).not.toContain('connectionString')
      expect(validation).toContain('bucket!: string')
      expect(validation).toContain('forcePathStyle?: boolean')
    })

    it('toma las credenciales de la config (R2 no tiene rol de instancia que heredar)', () => {
      const adapter = read('libs/backend/src/contexts/shared/infrastructure/storage/s3-file-storage.ts')
      const types = read('libs/backend/src/contexts/shared/infrastructure/config/config-types.ts')

      expect(adapter).toContain("configService.get<string>('storage.accessKeyId')")
      expect(adapter).toContain('credentials: { accessKeyId, secretAccessKey }')
      expect(types).toContain('accessKeyId?: string')
    })

    it('el StorageModule elige R2 o disco según la sección de config presente', () => {
      const withStorage: Tree = createTreeWithEmptyWorkspace()
      withStorage.write(
        STORAGE_MODULE,
        `import { Global, Module } from '@nestjs/common'
import { FileStoragePort } from '../../domain/storage/file-storage.port'
import { LocalFileStorage } from './local-file-storage'

@Global()
@Module({
  providers: [{ provide: FileStoragePort, useClass: LocalFileStorage }],
  exports: [FileStoragePort]
})
export class StorageModule {}
`
      )

      INFRA['raptor'].apply?.(withStorage, context)

      const storageModule = withStorage.read(STORAGE_MODULE, 'utf-8') ?? ''
      expect(storageModule).toContain('S3FileStorage')
      expect(storageModule).toContain('LocalFileStorage')
      expect(storageModule).toContain("config.get<string>('storage.bucket')")
    })

    it('no toca nada si la app no tiene StorageModule (sin adjuntos no hay almacenamiento)', () => {
      const withoutStorage: Tree = createTreeWithEmptyWorkspace()

      expect(() => INFRA['raptor'].apply?.(withoutStorage, context)).not.toThrow()
      expect(withoutStorage.exists(STORAGE_MODULE)).toBe(false)
    })
  })
})
