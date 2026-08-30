import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'
import { INFRA } from './registry'
import { SLOTS } from '../plugins/slots'

/**
 * TASK-02 (spec 77): el proveedor gcp — espejo del aws de la spec 47. Los secretos
 * `vault.*` se resuelven contra Secret Manager con el prefijo de GCP_SECRETS_PREFIX
 * (el contrato de nombres lo fijó iac/gcp: ids `${name}-typeorm-*` con guiones).
 */
describe('proveedor infra=gcp', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'gcp' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('está registrado como proveedor elegible de la ranura, detrás de raptor', () => {
    expect(Object.keys(INFRA)).toEqual(['none', 'azure', 'aws', 'raptor', 'gcp'])
    expect(SLOTS['infra'].providers.map(p => p.value)).toEqual(['none', 'azure', 'aws', 'raptor', 'gcp'])
  })

  it('emite el resolver de secretos de Secret Manager y su config loader', () => {
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/gcp/gcp-secret-resolver.ts')
    ).toBe(true)
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/gcp/gcp-config-loader.ts')
    ).toBe(true)
  })

  it('declara la dependencia del SDK que sus ficheros importan', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

    expect(pkg.dependencies['@google-cloud/secret-manager']).toBeDefined()
  })

  it('cambia el loader de config por el que resuelve vault.* contra Secret Manager', () => {
    const configModule = read('libs/backend/src/contexts/shared/infrastructure/config/config.module.ts')

    expect(configModule).toContain("from './loaders/gcp/gcp-config-loader'")
    expect(configModule).not.toContain("from './loaders/config-loader'")
  })

  it('el resolver antepone el prefijo de GCP_SECRETS_PREFIX y aplana vault.* con guiones', () => {
    const resolver = read('libs/backend/src/contexts/shared/infrastructure/config/loaders/gcp/gcp-secret-resolver.ts')

    expect(resolver).toContain('GCP_SECRETS_PREFIX')
    expect(resolver).toContain("replace(/\\./g, '-')")
    expect(resolver).toContain('SecretResolutionError')
  })

  it('el proyecto sale de las credenciales (ADC), nunca de la config', () => {
    const resolver = read('libs/backend/src/contexts/shared/infrastructure/config/loaders/gcp/gcp-secret-resolver.ts')

    expect(resolver).toContain('getProjectId()')
    expect(resolver).toContain('/versions/latest')
  })

  /**
   * TASK-03: el adapter de ficheros lo decide la CONFIG, no el build — mismo patrón que Blob
   * y S3. La sección `storage` cambia de forma: bucket/apiEndpoint (apiEndpoint cubre un
   * fake-gcs-server local con la MISMA sección, como endpoint en S3 cubre MinIO).
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
      sessionStore: 'postgres' as const,
      infra: 'gcp'
    }

    it('emite el adapter GCS y declara su SDK', () => {
      expect(
        tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/storage/gcs-file-storage.ts')
      ).toBe(true)
      const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }
      expect(pkg.dependencies['@google-cloud/storage']).toBeDefined()
    })

    it('la sección storage pasa a forma GCS: bucket en vez de connectionString', () => {
      const types = read('libs/backend/src/contexts/shared/infrastructure/config/config-types.ts')
      const validation = read('libs/backend/src/contexts/shared/infrastructure/config/config-validation.ts')

      expect(types).toContain('bucket: string')
      expect(types).toContain('apiEndpoint?: string')
      expect(types).not.toContain('connectionString')
      expect(validation).toContain('bucket!: string')
      expect(validation).not.toContain('connectionString')
    })

    it('el StorageModule elige GCS o disco según la sección de config presente', () => {
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

      INFRA['gcp'].apply?.(withStorage, context)

      const storageModule = withStorage.read(STORAGE_MODULE, 'utf-8') ?? ''
      expect(storageModule).toContain('GcsFileStorage')
      expect(storageModule).toContain('LocalFileStorage')
      expect(storageModule).toContain("config.get<string>('storage.bucket')")
    })

    it('no toca nada si la app no tiene StorageModule (sin adjuntos no hay almacenamiento)', () => {
      const withoutStorage: Tree = createTreeWithEmptyWorkspace()

      expect(() => INFRA['gcp'].apply?.(withoutStorage, context)).not.toThrow()
      expect(withoutStorage.exists(STORAGE_MODULE)).toBe(false)
    })
  })

  /**
   * TASK-04: sin instrument.ts ni OTel — el logger base ya escribe JSON a stdout (Cloud Run
   * lo envía solo a Cloud Logging). El transporte directo es LoggingWinston (pieza oficial
   * de Google, no un transporte propio como en aws: allí la lib de terceros estaba muerta),
   * entra por la costura EXTRA_LOG_TRANSPORTS y solo si la sección `cloudLogging` está
   * configurada (despliegues donde nada recoge stdout).
   */
  describe('logs', () => {
    it('emite el provider del transporte para la costura del logger', () => {
      expect(
        tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/logger/gcp-log-transports.ts')
      ).toBe(true)
    })

    it('enchufa su transporte en la costura del logger, sin tocar el logger base', () => {
      const loggerModule = read('libs/backend/src/contexts/shared/infrastructure/logger/logger.module.ts')
      expect(loggerModule).toContain('gcpLogTransportsProvider')

      const baseLogger = read('libs/backend/src/contexts/shared/infrastructure/logger/app-logger.service.ts')
      expect(baseLogger).not.toContain("from '@google-cloud/")
    })

    it('el transporte se activa por la sección cloudLogging de config, no por build', () => {
      const provider = read('libs/backend/src/contexts/shared/infrastructure/logger/gcp-log-transports.ts')
      expect(provider).toContain("config.get<string>('cloudLogging.logName')")
      expect(provider).toContain('LoggingWinston')

      const types = read('libs/backend/src/contexts/shared/infrastructure/config/config-types.ts')
      expect(types).toContain('cloudLogging?: CloudLoggingConfig')

      const validation = read('libs/backend/src/contexts/shared/infrastructure/config/config-validation.ts')
      expect(validation).toContain('CloudLoggingValidator')
    })

    it('declara el transporte oficial de Google para winston', () => {
      const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

      expect(pkg.dependencies['@google-cloud/logging-winston']).toBeDefined()
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
