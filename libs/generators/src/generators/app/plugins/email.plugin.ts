import type { Tree } from '@nx/devkit'
import * as path from 'path'
import { definePlugin, type PluginContext } from './plugin'

/**
 * Adaptadores de envío de email tras el puerto `EmailSender` del plugin de auth:
 * Azure Communication Services, Amazon SES y Brevo (capa gratuita), además del
 * SMTP y el logger que ya trae auth. La sección de config presente decide cuál
 * se usa; sin ninguna, los envíos se loguean (local/test).
 *
 * Requiere el plugin de auth: sin él no hay quién envíe emails.
 */
export const emailPlugin = definePlugin({
  name: 'email',
  description: 'Adaptadores de email: Azure ACS, Amazon SES y Brevo (gratuito)',
  assets: 'assets-email',
  dependencies: {
    // Los SDK se cargan perezosamente en el factory: instalarlos no obliga a usarlos,
    // pero tenerlos disponibles evita un fallo en runtime al activar su sección.
    '@aws-sdk/client-ses': '^3.700.0',
    '@azure/communication-email': '^1.0.0'
  },

  apply(tree: Tree, context: PluginContext): void {
    const authModule = path.join(context.backendSrc, 'contexts/iam/modules/auth/auth.module.ts')
    if (!tree.exists(authModule)) {
      console.warn('\n⚠ El plugin de email requiere el plugin de auth; no hay consumidor del puerto EmailSender.')
      return
    }

    extendConfigTypes(tree, context)
    extendConfigValidation(tree, context)
    rewireFactoryCall(tree, authModule)
  }
})

/** Añade las secciones acs/ses/brevo a los tipos de configuración del kernel. */
function extendConfigTypes(tree: Tree, context: PluginContext): void {
  const typesPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-types.ts')
  const source = tree.read(typesPath, 'utf-8')
  if (!source || source.includes('AcsEmailConfig')) {
    return
  }
  const withTypes = source.replace(
    'export interface StorageConfig {',
    `export interface AcsEmailConfig {
  connectionString: string
  senderAddress: string
}

export interface SesConfig {
  region: string
  from: string
}

export interface BrevoConfig {
  apiKey: string
  from: string
  fromName?: string
}

export interface StorageConfig {`
  )
  tree.write(
    typesPath,
    withTypes.replace(
      '  smtp?: SmtpConfig',
      '  acs?: AcsEmailConfig\n  ses?: SesConfig\n  brevo?: BrevoConfig\n  smtp?: SmtpConfig'
    )
  )
}

/** Secciones opcionales en el validador: presentes → forma correcta; ausentes → log sender. */
function extendConfigValidation(tree: Tree, context: PluginContext): void {
  const validationPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/config-validation.ts')
  const source = tree.read(validationPath, 'utf-8')
  if (!source || source.includes('AcsValidator')) {
    return
  }
  const withClasses = source.replace(
    'class SmtpValidator {',
    `class AcsValidator {
  @IsString()
  connectionString!: string

  @IsString()
  senderAddress!: string
}

class SesValidator {
  @IsString()
  region!: string

  @IsString()
  from!: string
}

class BrevoValidator {
  @IsString()
  apiKey!: string

  @IsString()
  from!: string

  @IsOptional()
  @IsString()
  fromName?: string
}

class SmtpValidator {`
  )
  tree.write(
    validationPath,
    withClasses.replace(
      /(\n {2}\/\/ Sección opcional: sin ella el módulo de auth[^\n]*\n)/,
      `\n  @IsOptional()
  @ValidateNested()
  @Type(() => AcsValidator)
  acs?: AcsValidator

  @IsOptional()
  @ValidateNested()
  @Type(() => SesValidator)
  ses?: SesValidator

  @IsOptional()
  @ValidateNested()
  @Type(() => BrevoValidator)
  brevo?: BrevoValidator
$1`
    )
  )
}

/** El factory con proveedores recibe todas las secciones, no solo smtp. */
function rewireFactoryCall(tree: Tree, authModulePath: string): void {
  const source = tree.read(authModulePath, 'utf-8')
  if (!source) {
    return
  }
  tree.write(
    authModulePath,
    source
      .replace(
        "createEmailSender(config.get<SmtpConfig>('smtp'), logger)",
        `createEmailSender(
          {
            acs: config.get<AcsEmailConfig>('acs'),
            ses: config.get<SesConfig>('ses'),
            brevo: config.get<BrevoConfig>('brevo'),
            smtp: config.get<SmtpConfig>('smtp')
          },
          logger
        )`
      )
      .replace(
        /import \{ SmtpConfig \} from '([^']*)config-types'/,
        "import { AcsEmailConfig, BrevoConfig, SesConfig, SmtpConfig } from '$1config-types'"
      )
  )
}
