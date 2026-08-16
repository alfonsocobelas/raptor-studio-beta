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
 * AWS (spec 47): los secretos se resuelven contra Secrets Manager (marcadores `vault.*`
 * con el prefijo de AWS_SECRETS_PREFIX). A diferencia de Azure no hay `instrument.ts`:
 * el logger base ya escribe JSON estructurado a stdout — App Runner lo envía solo a
 * CloudWatch Logs (consultable en Log Insights) — y el transporte directo llega en
 * TASK-04 para los despliegues donde nada recoge stdout.
 */
export const awsInfra = defineInfra({
  value: 'aws',
  label: 'AWS (Secrets Manager, S3, CloudWatch Logs)',
  files: 'files-infra-aws',
  dependencies: {
    '@aws-sdk/client-cloudwatch-logs': '^3.700.0',
    '@aws-sdk/client-s3': '^3.700.0',
    '@aws-sdk/client-secrets-manager': '^3.700.0',
    'winston-transport': '^4.7.0'
  },

  apply(tree: Tree, context: PluginContext): void {
    useAwsConfigLoader(tree, context)
    reshapeStorageConfigForS3(tree, context)
    bindS3Storage(tree, context)
    addCloudWatchConfigSection(tree, context)
    addAwsLogTransport(tree, context)
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

/**
 * La sección `storage` del kernel tiene la forma de Azure (connectionString + container);
 * con S3 pasa a bucket/region/endpoint. endpoint/forcePathStyle no son especulación: cubren
 * MinIO local con la MISMA sección, igual que el adapter del catálogo (storage-s3).
 */
function reshapeStorageConfigForS3(tree: Tree, context: PluginContext): void {
  const typesPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-types.ts')
  const types = tree.read(typesPath, 'utf-8')
  if (types && !types.includes('bucket: string')) {
    tree.write(
      typesPath,
      types.replace(
        `export interface StorageConfig {
  connectionString: string
  container: string
}`,
        `export interface StorageConfig {
  bucket: string
  region?: string
  /** S3-compatible endpoint: omit for AWS, set it (plus forcePathStyle) for local MinIO */
  endpoint?: string
  forcePathStyle?: boolean
}`
      )
    )
  }

  const validationPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-validation.ts')
  const validation = tree.read(validationPath, 'utf-8')
  if (validation && !validation.includes('bucket!: string')) {
    tree.write(
      validationPath,
      validation.replace(
        `class StorageValidator {
  @IsString()
  connectionString!: string

  @IsString()
  container!: string
}`,
        `class StorageValidator {
  @IsString()
  bucket!: string

  @IsOptional()
  @IsString()
  region?: string

  @IsOptional()
  @IsString()
  endpoint?: string

  @IsOptional()
  @IsBoolean()
  forcePathStyle?: boolean
}`
      )
    )
  }
}

/** Sección opcional `cloudwatch` en tipos y validación: presente → transporte directo. */
function addCloudWatchConfigSection(tree: Tree, context: PluginContext): void {
  const typesPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-types.ts')
  const types = tree.read(typesPath, 'utf-8')
  if (types && !types.includes('CloudWatchConfig')) {
    tree.write(
      typesPath,
      types
        .replace(
          'export interface StorageConfig {',
          `export interface CloudWatchConfig {
  logGroup: string
  /** Default: the runtime env name */
  logStream?: string
}

export interface StorageConfig {`
        )
        .replace('  storage?: StorageConfig', '  storage?: StorageConfig\n  cloudwatch?: CloudWatchConfig')
    )
  }

  const validationPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-validation.ts')
  const validation = tree.read(validationPath, 'utf-8')
  if (validation && !validation.includes('CloudWatchValidator')) {
    tree.write(
      validationPath,
      validation
        .replace(
          'class StorageValidator {',
          `class CloudWatchValidator {
  @IsString()
  logGroup!: string

  @IsOptional()
  @IsString()
  logStream?: string
}

class StorageValidator {`
        )
        .replace(
          '  storage?: StorageValidator\n}',
          `  storage?: StorageValidator

  @IsOptional()
  @ValidateNested()
  @Type(() => CloudWatchValidator)
  cloudwatch?: CloudWatchValidator
}`
        )
    )
  }
}

/** Espejo de addAzureLogTransport: enchufa el transporte CloudWatch en la costura del logger. */
function addAwsLogTransport(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/shared/infrastructure/logger/logger.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('awsLogTransportsProvider')) {
    return
  }
  tree.write(
    modulePath,
    source
      .replace(
        "import { AppLoggerService } from './app-logger.service'",
        "import { AppLoggerService } from './app-logger.service'\nimport { awsLogTransportsProvider } from './aws-log-transports'"
      )
      .replace('  providers: [\n    AppLoggerService,', '  providers: [\n    awsLogTransportsProvider,\n    AppLoggerService,')
  )
}

/**
 * Espejo de bindBlobStorage (azure): el adapter de ficheros lo decide la CONFIG, no el
 * build — con `storage.bucket` configurado los ficheros van a S3; sin él, a disco local.
 */
function bindS3Storage(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/shared/infrastructure/storage/storage.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('S3FileStorage')) {
    return
  }
  tree.write(
    modulePath,
    `import { Global, Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FileStoragePort } from '../../domain/storage/file-storage.port'
import { S3FileStorage } from './s3-file-storage'
import { LocalFileStorage } from './local-file-storage'

/**
 * Global: cualquier módulo con adjuntos inyecta FileStoragePort sin re-declararlo.
 *
 * El adapter lo decide la CONFIG, no el build: con la sección \`storage\` configurada los ficheros
 * van a S3; sin ella, a disco local. Así el mismo binario sirve para local y para la nube.
 */
@Global()
@Module({
  providers: [
    {
      provide: FileStoragePort,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('storage.bucket') ? new S3FileStorage(config) : new LocalFileStorage()
    }
  ],
  exports: [FileStoragePort]
})
export class StorageModule {}
`
  )
}

/** Espejo de useAzureConfigLoader: la costura de secretos apunta al loader de Secrets Manager. */
function useAwsConfigLoader(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('aws-config-loader')) {
    return
  }
  tree.write(modulePath, source.replace("from './loaders/config-loader'", "from './loaders/aws/aws-config-loader'"))
}

/** Orden del registro = orden en el formulario. */
export const INFRA_PROVIDERS: readonly InfraProvider[] = [noneInfra, azureInfra, awsInfra]
