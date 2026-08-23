import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'
import { INFRA } from './registry'
import { SLOTS } from '../plugins/slots'

/**
 * TASK-02 (spec 47): el proveedor aws — espejo del azure de la spec 24. Los secretos
 * `vault.*` se resuelven contra Secrets Manager con el prefijo de AWS_SECRETS_PREFIX.
 */
describe('proveedor infra=aws', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'aws' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('está registrado como proveedor elegible de la ranura, detrás de azure', () => {
    expect(Object.keys(INFRA)).toEqual(['none', 'azure', 'aws', 'raptor'])
    expect(SLOTS['infra'].providers.map(p => p.value)).toEqual(['none', 'azure', 'aws', 'raptor'])
  })

  it('emite el resolver de secretos de Secrets Manager y su config loader', () => {
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/aws/aws-secret-resolver.ts')
    ).toBe(true)
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/aws/aws-config-loader.ts')
    ).toBe(true)
  })

  it('declara la dependencia del SDK que sus ficheros importan', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

    expect(pkg.dependencies['@aws-sdk/client-secrets-manager']).toBeDefined()
  })

  it('cambia el loader de config por el que resuelve vault.* contra Secrets Manager', () => {
    const configModule = read('libs/backend/src/contexts/shared/infrastructure/config/config.module.ts')

    expect(configModule).toContain("from './loaders/aws/aws-config-loader'")
    expect(configModule).not.toContain("from './loaders/config-loader'")
  })

  it('el resolver antepone el prefijo de AWS_SECRETS_PREFIX y aplana vault.* con guiones', () => {
    const resolver = read('libs/backend/src/contexts/shared/infrastructure/config/loaders/aws/aws-secret-resolver.ts')

    expect(resolver).toContain('AWS_SECRETS_PREFIX')
    expect(resolver).toContain("replace(/\\./g, '-')")
    expect(resolver).toContain('SecretResolutionError')
  })

  /**
   * TASK-03: el adapter de ficheros lo decide la CONFIG, no el build — mismo patrón que Blob
   * en azure. La sección `storage` cambia de forma: bucket/region/endpoint en vez de la
   * connectionString de Azure (endpoint/forcePathStyle cubren MinIO local con la MISMA sección).
   */
  describe('storage', () => {
    const STORAGE_MODULE = 'apps/demo/libs/backend/src/contexts/shared/infrastructure/storage/storage.module.ts'

    const context = {
      root: 'apps/demo',
      appName: 'demo',
      backendSrc: 'apps/demo/libs/backend/src',
      frontendSrc: 'apps/demo/libs/frontend/src',
      models: [],
      scope: '@app',
      sessionStore: 'postgres' as const
    }

    it('emite el adapter S3 y declara su SDK', () => {
      expect(tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/storage/s3-file-storage.ts')).toBe(
        true
      )
      const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }
      expect(pkg.dependencies['@aws-sdk/client-s3']).toBeDefined()
    })

    it('la sección storage pasa a forma S3: bucket en vez de connectionString', () => {
      const types = read('libs/backend/src/contexts/shared/infrastructure/config/config-types.ts')
      const validation = read('libs/backend/src/contexts/shared/infrastructure/config/config-validation.ts')

      expect(types).toContain('bucket: string')
      expect(types).not.toContain('connectionString')
      expect(validation).toContain('bucket!: string')
      expect(validation).not.toContain('connectionString')
    })

    it('el StorageModule elige S3 o disco según la sección de config presente', () => {
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

      INFRA['aws'].apply?.(withStorage, context)

      const storageModule = withStorage.read(STORAGE_MODULE, 'utf-8') ?? ''
      expect(storageModule).toContain('S3FileStorage')
      expect(storageModule).toContain('LocalFileStorage')
      expect(storageModule).toContain("config.get<string>('storage.bucket')")
    })

    it('no toca nada si la app no tiene StorageModule (sin adjuntos no hay almacenamiento)', () => {
      const withoutStorage: Tree = createTreeWithEmptyWorkspace()

      expect(() => INFRA['aws'].apply?.(withoutStorage, context)).not.toThrow()
      expect(withoutStorage.exists(STORAGE_MODULE)).toBe(false)
    })
  })

  /**
   * TASK-04: sin instrument.ts ni OTel — el logger base ya escribe JSON a stdout (App Runner
   * lo envía solo a CloudWatch). El transporte directo entra por la costura EXTRA_LOG_TRANSPORTS
   * y solo si la sección `cloudwatch` está configurada (despliegues donde nada recoge stdout).
   */
  describe('logs', () => {
    it('emite el transporte CloudWatch y su provider para la costura del logger', () => {
      expect(
        tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/logger/cloudwatch-logs-transport.ts')
      ).toBe(true)
      expect(
        tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/logger/aws-log-transports.ts')
      ).toBe(true)
    })

    it('enchufa su transporte en la costura del logger, sin tocar el logger base', () => {
      const loggerModule = read('libs/backend/src/contexts/shared/infrastructure/logger/logger.module.ts')
      expect(loggerModule).toContain('awsLogTransportsProvider')

      const baseLogger = read('libs/backend/src/contexts/shared/infrastructure/logger/app-logger.service.ts')
      expect(baseLogger).not.toContain("from '@aws-sdk/")
    })

    it('el transporte se activa por la sección cloudwatch de config, no por build', () => {
      const provider = read('libs/backend/src/contexts/shared/infrastructure/logger/aws-log-transports.ts')
      expect(provider).toContain("config.get<string>('cloudwatch.logGroup')")

      const types = read('libs/backend/src/contexts/shared/infrastructure/config/config-types.ts')
      expect(types).toContain('cloudwatch?: CloudWatchConfig')

      const validation = read('libs/backend/src/contexts/shared/infrastructure/config/config-validation.ts')
      expect(validation).toContain('CloudWatchValidator')
    })

    it('declara el SDK de CloudWatch Logs y la base de transportes de winston', () => {
      const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

      expect(pkg.dependencies['@aws-sdk/client-cloudwatch-logs']).toBeDefined()
      expect(pkg.dependencies['winston-transport']).toBeDefined()
    })

    it('no emite telemetría de arranque: no hay SDK que parchear antes de los imports', () => {
      expect(tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/telemetry/instrument.ts')).toBe(
        false
      )
      const main = read('apps/backend-api/src/main.ts')
      expect(main).not.toContain('telemetry/instrument')
    })
  })
})
