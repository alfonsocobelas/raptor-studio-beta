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
 * Raptor Cloud (spec 50): la composición low-cost. No es una nube, es un stack de servicios
 * con capa gratuita —Infisical para secretos, Cloudflare R2 para ficheros, Grafana Cloud
 * Loki para logs, Brevo para email— sobre un VPS de Hetzner (ver `iac/hetzner`).
 *
 * Su rasgo de diseño: los adapters hablan HTTP con el `fetch` de la plataforma en vez de
 * traer SDK propietarios. Un proveedor cuyo argumento es el coste no puede arrastrar 30 MB
 * de dependencias; la única que entra es el cliente de S3, porque R2 habla ese protocolo.
 */
export const raptorInfra = defineInfra({
  value: 'raptor',
  label: 'Raptor Cloud (Infisical, R2, Grafana Loki, Brevo — low cost)',
  files: 'files-infra-raptor',
  dependencies: {
    // R2 habla el protocolo de S3; es el único SDK de nube que entra en este proveedor.
    '@aws-sdk/client-s3': '^3.700.0',
    'winston-transport': '^4.7.0',
    // Se carga perezosamente en el transporte: instalarlo no obliga a usarlo, pero tenerlo
    // disponible evita un fallo en runtime al activar la sección `sentry`.
    '@sentry/node': '^8.0.0'
  },

  apply(tree: Tree, context: PluginContext): void {
    useInfisicalConfigLoader(tree, context)
    reshapeStorageConfigForR2(tree, context)
    bindS3Storage(tree, context)
    addLokiConfigSection(tree, context)
    addSentryConfigSection(tree, context)
    nameLokiStream(tree, context)
    addRaptorLogTransport(tree, context)
    nameTerraformProject(tree, context)
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

/**
 * Como `reshapeStorageConfigForS3`, pero la sección lleva además las credenciales: R2 no
 * tiene rol de instancia del que colgarse, así que las llaves viajan como marcadores
 * `vault.*` y las resuelve Infisical al arrancar.
 */
function reshapeStorageConfigForR2(tree: Tree, context: PluginContext): void {
  reshapeStorageConfigForS3(tree, context)

  const typesPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-types.ts')
  const types = tree.read(typesPath, 'utf-8')
  if (types && !types.includes('accessKeyId?: string')) {
    tree.write(
      typesPath,
      types.replace(
        '  forcePathStyle?: boolean\n}',
        `  forcePathStyle?: boolean
  /** Resolved from Infisical: R2 has no instance role to inherit credentials from */
  accessKeyId?: string
  secretAccessKey?: string
}`
      )
    )
  }

  const validationPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-validation.ts')
  const validation = tree.read(validationPath, 'utf-8')
  if (validation && !validation.includes('accessKeyId?: string')) {
    tree.write(
      validationPath,
      validation.replace(
        `  @IsOptional()
  @IsBoolean()
  forcePathStyle?: boolean
}`,
        `  @IsOptional()
  @IsBoolean()
  forcePathStyle?: boolean

  @IsOptional()
  @IsString()
  accessKeyId?: string

  @IsOptional()
  @IsString()
  secretAccessKey?: string
}`
      )
    )
  }
}

/** Sección opcional `sentry`: presente → los errores y avisos se reportan además a Sentry. */
function addSentryConfigSection(tree: Tree, context: PluginContext): void {
  const typesPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-types.ts')
  const types = tree.read(typesPath, 'utf-8')
  if (types && !types.includes('SentryConfig')) {
    tree.write(
      typesPath,
      types
        .replace(
          'export interface StorageConfig {',
          `export interface SentryConfig {
  dsn: string
  /** Default: the runtime env name */
  environment?: string
}

export interface StorageConfig {`
        )
        .replace('  storage?: StorageConfig', '  storage?: StorageConfig\n  sentry?: SentryConfig')
    )
  }

  const validationPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-validation.ts')
  const validation = tree.read(validationPath, 'utf-8')
  if (validation && !validation.includes('SentryValidator')) {
    tree.write(
      validationPath,
      validation
        .replace(
          'class StorageValidator {',
          `class SentryValidator {
  @IsString()
  dsn!: string

  @IsOptional()
  @IsString()
  environment?: string
}

class StorageValidator {`
        )
        .replace(
          '  storage?: StorageValidator\n}',
          `  storage?: StorageValidator

  @IsOptional()
  @ValidateNested()
  @Type(() => SentryValidator)
  sentry?: SentryValidator
}`
        )
    )
  }
}

/** Sección opcional `loki` en tipos y validación: presente → los logs salen también a Loki. */
function addLokiConfigSection(tree: Tree, context: PluginContext): void {
  const typesPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-types.ts')
  const types = tree.read(typesPath, 'utf-8')
  if (types && !types.includes('LokiConfig')) {
    tree.write(
      typesPath,
      types
        .replace(
          'export interface StorageConfig {',
          `export interface LokiConfig {
  url: string
  /** Grafana Cloud user id; omit both credentials for an unauthenticated self-hosted Loki */
  user?: string
  apiKey?: string
}

export interface StorageConfig {`
        )
        .replace('  storage?: StorageConfig', '  storage?: StorageConfig\n  loki?: LokiConfig')
    )
  }

  const validationPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-validation.ts')
  const validation = tree.read(validationPath, 'utf-8')
  if (validation && !validation.includes('LokiValidator')) {
    tree.write(
      validationPath,
      validation
        .replace(
          'class StorageValidator {',
          `class LokiValidator {
  @IsString()
  url!: string

  @IsOptional()
  @IsString()
  user?: string

  @IsOptional()
  @IsString()
  apiKey?: string
}

class StorageValidator {`
        )
        .replace(
          '  storage?: StorageValidator\n}',
          `  storage?: StorageValidator

  @IsOptional()
  @ValidateNested()
  @Type(() => LokiValidator)
  loki?: LokiValidator
}`
        )
    )
  }
}

/**
 * La etiqueta `app` de los streams de Loki se fija al generar: no es configuración de
 * despliegue (el binario de esta app siempre es esta app), y la config emitida no tiene
 * un `appName` del que leerla.
 */
function nameLokiStream(tree: Tree, context: PluginContext): void {
  const providerPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/logger/raptor-log-transports.ts')
  const source = tree.read(providerPath, 'utf-8')
  if (!source) {
    return
  }
  tree.write(providerPath, source.replace("const APP_NAME = 'app'", `const APP_NAME = '${context.appName}'`))
}

/**
 * El stack de Terraform viaja DENTRO de la app (spec 50): el cliente recibe el proyecto, no
 * el repo del acelerador. Lo único que depende de la app es el prefijo de nombres, que en
 * los stacks de aws y hetzner es el default de la variable `project`.
 *
 * El reemplazo apunta a ESE bloque, no a la primera "acelerador" del fichero: en el stack de
 * azure —que nombra recurso a recurso y no tiene variable `project`— la única aparición es
 * el nombre de la base de datos, y un reemplazo ciego la renombraría.
 */
function nameTerraformProject(tree: Tree, context: PluginContext): void {
  const variablesPath = path.join(context.root, 'iac/variables.tf')
  const source = tree.read(variablesPath, 'utf-8')
  if (!source) {
    return
  }
  tree.write(
    variablesPath,
    source.replace(/(variable "project" \{[^}]*default\s+= )"acelerador"/, `$1"${context.appName}"`)
  )
}

/** Espejo de addAwsLogTransport: enchufa el transporte de Loki en la costura del logger. */
function addRaptorLogTransport(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/shared/infrastructure/logger/logger.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('raptorLogTransportsProvider')) {
    return
  }
  tree.write(
    modulePath,
    source
      .replace(
        "import { AppLoggerService } from './app-logger.service'",
        "import { AppLoggerService } from './app-logger.service'\nimport { raptorLogTransportsProvider } from './raptor-log-transports'"
      )
      .replace(
        '  providers: [\n    AppLoggerService,',
        '  providers: [\n    raptorLogTransportsProvider,\n    AppLoggerService,'
      )
  )
}

/** Espejo de useAwsConfigLoader: la costura de secretos apunta al loader de Infisical. */
function useInfisicalConfigLoader(tree: Tree, context: PluginContext): void {
  const modulePath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config.module.ts')
  const source = tree.read(modulePath, 'utf-8')
  if (!source || source.includes('infisical-config-loader')) {
    return
  }
  tree.write(
    modulePath,
    source.replace("from './loaders/config-loader'", "from './loaders/infisical/infisical-config-loader'")
  )
}

/** Orden del registro = orden en el formulario. */
export const INFRA_PROVIDERS: readonly InfraProvider[] = [noneInfra, azureInfra, awsInfra, raptorInfra]
