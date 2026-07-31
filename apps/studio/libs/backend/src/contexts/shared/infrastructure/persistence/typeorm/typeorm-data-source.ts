import { DataSource, DataSourceOptions } from 'typeorm'
import { join } from 'path'
import { SnakeNamingStrategy } from './snake-naming.strategy'
import loadConfig from '../../config/loaders/azure/azure-config-loader'
import { TypeOrmConfig } from '../../config/config-types'

// Solo los campos de conexión que el DataSource necesita: desacopla el builder del
// tipo completo (TypeOrmConfig) y del validador (TypeOrmValidator), ambos compatibles.
type DataSourceConfig = Pick<
  TypeOrmConfig,
  'host' | 'port' | 'username' | 'password' | 'database' | 'ssl' | 'synchronize' | 'dropSchema' | 'logging'
>

/**
 * Pure builder so the DataSource options (in particular `ssl`, which Azure
 * Postgres Flexible Server requires) are unit-testable without resolving the
 * config from Key Vault or opening a connection.
 */
export function buildDataSourceOptions(typeorm: DataSourceConfig): DataSourceOptions {
  return {
    type: 'postgres',
    host: typeorm.host,
    port: typeorm.port,
    username: typeorm.username,
    password: typeorm.password,
    database: typeorm.database,
    ssl: typeorm.ssl,
    synchronize: typeorm.synchronize,
    dropSchema: typeorm.dropSchema,
    logging: typeorm.logging,
    migrationsTransactionMode: 'all',
    namingStrategy: new SnakeNamingStrategy(),
    entities: [join(__dirname, '../../../../**/*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations/*.{ts,js}')]
  }
}

/**
 * The TypeORM CLI awaits the exported value, so we can resolve the config
 * (including `vault.*` secrets from Azure Key Vault for cloud environments)
 * before instantiating the DataSource.
 */
export const AppDataSource = loadConfig().then(config => new DataSource(buildDataSourceOptions(config.typeorm)))
