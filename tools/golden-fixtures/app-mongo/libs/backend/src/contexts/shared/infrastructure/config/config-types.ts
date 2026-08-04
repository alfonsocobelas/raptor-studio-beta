export interface MongoConfig {
  // URI completa de conexión (incluye credenciales, base de datos y replicaSet);
  // las transacciones de Mongoose exigen replica set, también en local/test.
  uri: string
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
  mongo: MongoConfig
  smtp?: SmtpConfig
  storage?: StorageConfig
}
