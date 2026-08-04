import type { Tree } from '@nx/devkit'
import * as path from 'path'
import { defineInfra, type InfraProvider } from './provider'
import type { PluginContext } from '../plugins/plugin'

/**
 * Sin infraestructura: la app se lleva su config en los JSON por entorno, registra en stdout y
 * guarda ficheros en disco. Es el default a propósito — una app entregada sin elegir nube no
 * debe arrastrar el SDK de ninguna.
 */
export const noneInfra = defineInfra({
  value: 'none',
  label: 'Ninguna (sin adapters de nube ni IaC)'
})

/**
 * Azure: los secretos se resuelven contra Key Vault (los JSON solo llevan marcadores
 * `vault.*`), y el almacenamiento de ficheros va a Blob Storage. La telemetría con App
 * Insights la añade TASK-05.
 *
 * Las dependencias se declaran aquí porque los ficheros que emite las importan: cuando
 * vivían en el kernel base, el emitido las importaba SIN declararlas y solo compilaba
 * dentro de este monorepo, por hoisting.
 */
export const azureInfra = defineInfra({
  value: 'azure',
  label: 'Azure (Key Vault, Blob Storage, App Insights)',
  files: 'files-infra-azure',
  dependencies: {
    '@azure/identity': '4.13.1',
    '@azure/keyvault-secrets': '4.11.2',
    '@azure/monitor-opentelemetry': '^1.18.2',
    '@azure/storage-blob': '12.33.0',
    '@opentelemetry/winston-transport': '^0.30.0'
  },

  apply(tree: Tree, context: PluginContext): void {
    useAzureConfigLoader(tree, context)
    instrumentBeforeEverythingElse(tree, context)
    addAzureLogTransport(tree, context)
    bindBlobStorage(tree, context)
  }
})

/**
 * La telemetría se inicializa antes que cualquier otro import: el SDK de Azure Monitor debe
 * parchear los módulos (http, pg…) antes de que la app los cargue.
 */
function instrumentBeforeEverythingElse(tree: Tree, context: PluginContext): void {
  const mainPath = path.join(context.root, 'apps/backend-api/src/main.ts')
  const source = tree.read(mainPath, 'utf-8')
  if (!source || source.includes('telemetry/instrument')) {
    return
  }
  tree.write(
    mainPath,
    `// La telemetría se inicializa antes que cualquier otro import: el SDK de Azure
// Monitor debe parchear los módulos (http, pg…) antes de que la app los cargue.
import '${context.scope}/backend/contexts/shared/infrastructure/telemetry/instrument'
${source}`
  )
}

/** Enchufa el transporte OTel en la costura que deja abierta el logger base. */
function addAzureLogTransport(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/shared/infrastructure/logger/logger.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('azureLogTransportsProvider')) {
    return
  }
  tree.write(
    modulePath,
    source
      .replace(
        "import { AppLoggerService } from './app-logger.service'",
        "import { AppLoggerService } from './app-logger.service'\nimport { azureLogTransportsProvider } from './azure-log-transports'"
      )
      .replace(
        '  providers: [\n    AppLoggerService,',
        '  providers: [\n    azureLogTransportsProvider,\n    AppLoggerService,'
      )
  )
}

/**
 * TASK-06: el adapter de ficheros se elige por la SECCIÓN DE CONFIG presente, igual que ya hace
 * el plugin de email con sus proveedores de correo: con `storage` configurado va a Blob, sin ella
 * a disco local. Así `make local-setup` funciona sin cuenta de Azure y el mismo binario sirve
 * para local y para producción.
 */
function bindBlobStorage(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/shared/infrastructure/storage/storage.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('AzureBlobFileStorage')) {
    return
  }
  tree.write(
    modulePath,
    `import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FileStoragePort } from '../../domain/storage/file-storage.port'
import { AzureBlobFileStorage } from './azure-blob-file-storage'
import { LocalFileStorage } from './local-file-storage'

/**
 * Global: cualquier módulo con adjuntos inyecta FileStoragePort sin re-declararlo.
 *
 * El adapter lo decide la CONFIG, no el build: con la sección \`storage\` configurada los ficheros
 * van a Azure Blob; sin ella, a disco local. Así el mismo binario sirve para local y para la nube.
 */
@Global()
@Module({
  providers: [
    {
      provide: FileStoragePort,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('storage.connectionString')
          ? new AzureBlobFileStorage(config)
          : new LocalFileStorage()
    }
  ],
  exports: [FileStoragePort]
})
export class StorageModule {}
`
  )
}

/**
 * El loader es la costura de resolución de secretos que el módulo de config deja abierta:
 * con Azure se cambia por el que resuelve `vault.*` contra Key Vault.
 */
function useAzureConfigLoader(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('azure-config-loader')) {
    return
  }
  tree.write(modulePath, source.replace("from './loaders/config-loader'", "from './loaders/azure/azure-config-loader'"))
}

/** Orden del registro = orden en el formulario. */
export const INFRA_PROVIDERS: readonly InfraProvider[] = [noneInfra, azureInfra]
