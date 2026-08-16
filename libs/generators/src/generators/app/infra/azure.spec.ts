import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import type { Tree } from '@nx/devkit'
import { appGenerator } from '../app'
import { INFRA } from './registry'
import { SLOTS } from '../plugins/slots'

/**
 * TASK-04 (spec 24): el proveedor azure devuelve al emitido lo que la base dejó de llevar,
 * pero solo cuando se pide — y esta vez con sus dependencias declaradas de verdad.
 */
describe('proveedor infra=azure', () => {
  let tree: Tree

  beforeAll(async () => {
    tree = createTreeWithEmptyWorkspace()
    await appGenerator(tree, { name: 'demo', models: 'contract', skipInstall: true, infra: 'azure' })
  })

  const read = (file: string): string => tree.read(`apps/demo/${file}`, 'utf-8') ?? ''

  it('está registrado como proveedor elegible de la ranura', () => {
    expect(Object.keys(INFRA)).toEqual(['none', 'azure', 'aws'])
    expect(SLOTS['infra'].providers.map(p => p.value)).toEqual(['none', 'azure', 'aws'])
  })

  it('emite el resolver de secretos de Key Vault y el adapter de Blob', () => {
    expect(
      tree.exists(
        'apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/azure-secret-resolver.ts'
      )
    ).toBe(true)
    expect(
      tree.exists(
        'apps/demo/libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/azure-config-loader.ts'
      )
    ).toBe(true)
    expect(
      tree.exists('apps/demo/libs/backend/src/contexts/shared/infrastructure/storage/azure-blob-file-storage.ts')
    ).toBe(true)
  })

  it('declara las dependencias del SDK que sus ficheros importan', () => {
    const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

    expect(pkg.dependencies['@azure/identity']).toBeDefined()
    expect(pkg.dependencies['@azure/keyvault-secrets']).toBeDefined()
    expect(pkg.dependencies['@azure/storage-blob']).toBeDefined()
  })

  it('cambia el loader de config por el que resuelve vault.* contra Key Vault', () => {
    const configModule = read('libs/backend/src/contexts/shared/infrastructure/config/config.module.ts')

    expect(configModule).toContain("from './loaders/azure/azure-config-loader'")
    expect(configModule).not.toContain("from './loaders/config-loader'")
  })

  it('deja el resto del árbol igual que sin infra (el proveedor añade, no reescribe)', async () => {
    const plain: Tree = createTreeWithEmptyWorkspace()
    await appGenerator(plain, { name: 'demo', models: 'contract', skipInstall: true })

    const azureOnly = tree
      .listChanges()
      .filter(change => !plain.exists(change.path))
      .map(change => change.path.replace('apps/demo/', ''))

    expect(azureOnly.sort()).toEqual([
      'libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/azure-config-loader.ts',
      'libs/backend/src/contexts/shared/infrastructure/config/loaders/azure/azure-secret-resolver.ts',
      'libs/backend/src/contexts/shared/infrastructure/logger/azure-log-transports.ts',
      'libs/backend/src/contexts/shared/infrastructure/storage/azure-blob-file-storage.ts',
      'libs/backend/src/contexts/shared/infrastructure/telemetry/init-telemetry.ts',
      'libs/backend/src/contexts/shared/infrastructure/telemetry/instrument.ts'
    ])
  })

  /** TASK-05: la telemetría que era el plugin `observability` ahora la trae el proveedor. */
  describe('telemetría', () => {
    it('instrument es el PRIMER import de main.ts (OTel debe parchear antes de todo)', () => {
      const main = read('apps/backend-api/src/main.ts')
      const firstImport = main.split('\n').find(line => line.startsWith('import'))

      expect(firstImport).toContain('telemetry/instrument')
    })

    it('enchufa su transporte OTel en la costura del logger, sin tocar el logger base', () => {
      const loggerModule = read('libs/backend/src/contexts/shared/infrastructure/logger/logger.module.ts')

      expect(loggerModule).toContain('azureLogTransportsProvider')

      // lo que importa es que el logger base no DEPENDA de OTel ni de Azure (mencionarlos en un
      // comentario como ejemplo de la costura es información, no acoplamiento)
      const baseLogger = read('libs/backend/src/contexts/shared/infrastructure/logger/app-logger.service.ts')
      expect(baseLogger).not.toContain("from '@opentelemetry/")
      expect(baseLogger).not.toContain("from '@azure/")
    })

    it('declara el SDK de Azure Monitor y el transporte de winston', () => {
      const pkg = JSON.parse(read('package.json')) as { dependencies: Record<string, string> }

      expect(pkg.dependencies['@azure/monitor-opentelemetry']).toBeDefined()
      expect(pkg.dependencies['@opentelemetry/winston-transport']).toBeDefined()
    })
  })

  /**
   * TASK-06: el adapter de ficheros lo decide la CONFIG, no el build.
   *
   * Se prueba sobre `apply()` en vez de sobre una app generada porque hoy NINGÚN modelo
   * registrado declara `attachments: true`: sin adjuntos el kernel no emite StorageModule, así
   * que no hay app real donde ejercitarlo (mismo hueco que ya anota el ROADMAP para el golden
   * de adjuntos).
   */
  describe('storage', () => {
    const STORAGE_MODULE = 'apps/demo/libs/backend/src/contexts/shared/infrastructure/storage/storage.module.ts'

    it('el StorageModule elige Blob o disco según la sección de config presente', () => {
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

      INFRA['azure'].apply?.(withStorage, {
        root: 'apps/demo',
        appName: 'demo',
        backendSrc: 'apps/demo/libs/backend/src',
        frontendSrc: 'apps/demo/libs/frontend/src',
        models: [],
        scope: '@app'
      })

      const storageModule = withStorage.read(STORAGE_MODULE, 'utf-8') ?? ''
      expect(storageModule).toContain('AzureBlobFileStorage')
      expect(storageModule).toContain('LocalFileStorage')
      expect(storageModule).toContain("config.get<string>('storage.connectionString')")
    })

    it('no toca nada si la app no tiene StorageModule (sin adjuntos no hay almacenamiento)', () => {
      const withoutStorage: Tree = createTreeWithEmptyWorkspace()

      expect(() =>
        INFRA['azure'].apply?.(withoutStorage, {
          root: 'apps/demo',
          appName: 'demo',
          backendSrc: 'apps/demo/libs/backend/src',
          frontendSrc: 'apps/demo/libs/frontend/src',
          models: [],
          scope: '@app'
        })
      ).not.toThrow()
      expect(withoutStorage.exists(STORAGE_MODULE)).toBe(false)
    })
  })
})
