export interface TypeOrmConfig {
  type: string
  host: string
  port: number
  username: string
  password: string
  database: string
  // Azure Postgres Flexible Server exige conexión cifrada (require_secure_transport=ON);
  // true en dev/qa/prod, false para el Postgres local/test sin TLS.
  ssl?: boolean
  synchronize: boolean
  dropSchema: boolean
  logging: boolean
  autoLoadEntities: boolean
  migrationsTransactionMode: string
  migrationsRun: boolean
}

export interface LoggerConfig {
  level: string
}

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  auth?: { user: string; pass: string }
  from?: string
}

export interface AcsEmailConfig {
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

export interface StorageConfig {
  connectionString: string
  container: string
}

export interface AppConfig {
  env: string
  app: {
    port: number
    baseUrl: string
  }
  logger: LoggerConfig
  typeorm: TypeOrmConfig
  acs?: AcsEmailConfig
  ses?: SesConfig
  brevo?: BrevoConfig
  smtp?: SmtpConfig
  storage?: StorageConfig
}
