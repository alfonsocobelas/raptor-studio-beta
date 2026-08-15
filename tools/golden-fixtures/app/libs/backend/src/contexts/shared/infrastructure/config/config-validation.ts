import { plainToInstance, Type } from 'class-transformer'
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested, validateSync } from 'class-validator'

class TypeOrmValidator {
  @IsString()
  host!: string

  @IsNumber()
  port!: number

  @IsString()
  username!: string

  @IsString()
  password!: string

  @IsString()
  database!: string

  @IsOptional()
  @IsBoolean()
  ssl?: boolean

  @IsBoolean()
  synchronize!: boolean

  @IsBoolean()
  dropSchema!: boolean

  @IsBoolean()
  logging!: boolean

  @IsBoolean()
  migrationsRun!: boolean
}

class AppValidator {
  @IsNumber()
  port!: number

  @IsString()
  baseUrl!: string
}

class LoggerValidator {
  @IsString()
  level!: string
}

class SmtpAuthValidator {
  @IsString()
  user!: string

  @IsString()
  pass!: string
}

class AcsValidator {
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

class SmtpValidator {
  @IsString()
  host!: string

  @IsNumber()
  port!: number

  @IsBoolean()
  secure!: boolean

  @IsOptional()
  @ValidateNested()
  @Type(() => SmtpAuthValidator)
  auth?: SmtpAuthValidator

  @IsOptional()
  @IsString()
  from?: string
}

class StorageValidator {
  @IsString()
  connectionString!: string

  @IsString()
  container!: string
}

export class RootValidator {
  @IsString()
  env!: string

  @ValidateNested()
  @Type(() => AppValidator)
  app!: AppValidator

  @ValidateNested()
  @Type(() => LoggerValidator)
  logger!: LoggerValidator

  @ValidateNested()
  @Type(() => TypeOrmValidator)
  typeorm!: TypeOrmValidator

  @IsOptional()
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

  // Sección opcional: sin ella el módulo de auth cae a LogEmailSender (no envía emails reales).
  @IsOptional()
  @ValidateNested()
  @Type(() => SmtpValidator)
  smtp?: SmtpValidator

  // Sección opcional: solo si el proyecto usa el puerto de storage (@raptor/infra-ports).
  @IsOptional()
  @ValidateNested()
  @Type(() => StorageValidator)
  storage?: StorageValidator
}

export function validate(config: Record<string, unknown>): RootValidator {
  const validatedConfig = plainToInstance(RootValidator, config, { enableImplicitConversion: true })
  const errors = validateSync(validatedConfig, { skipMissingProperties: false })

  if (errors.length) {
    throw new Error(`Config validation failed: ${errors.toString()}`)
  }

  return validatedConfig
}
