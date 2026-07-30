import { names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { ColumnDefinition, FieldDefinition, ResourceDefinition } from '@acc/schema'
import { definePlugin, type PluginContext } from './plugin'

const MIGRATIONS_DIR = 'contexts/shared/infrastructure/persistence/typeorm/migrations'
const DATA_SOURCE = 'libs/backend/src/contexts/shared/infrastructure/persistence/typeorm/typeorm-data-source.ts'
const TS_NODE = 'ts-node -r tsconfig-paths/register'

/**
 * Migraciones TypeORM en vez de `synchronize`. Emite la migración inicial derivada de
 * los modelos (el esquema ya está descrito en el resource-schema: tipos, longitudes,
 * defaults y unicidad), más los scripts de generate/run/revert.
 *
 * Estilo tomado del proyecto de referencia: SQL crudo, `CREATE SCHEMA IF NOT EXISTS`
 * como primera sentencia, constraints nombradas y `down` con `DROP … IF EXISTS`.
 * La transaccionalidad la da `migrationsTransactionMode: 'all'` del DataSource.
 */
export const migrationsPlugin = definePlugin({
  name: 'migrations',
  description: 'Migraciones TypeORM con la migración inicial derivada de los modelos',
  scripts: {
    'migration:create': `${TS_NODE} ./node_modules/typeorm/cli.js migration:create libs/backend/src/${MIGRATIONS_DIR}/Migration`,
    'migration:generate': `NODE_ENV=local ${TS_NODE} ./node_modules/typeorm/cli.js migration:generate -d ${DATA_SOURCE} libs/backend/src/${MIGRATIONS_DIR}/Migration`,
    'migration:run': `NODE_ENV=local ${TS_NODE} ./node_modules/typeorm/cli.js migration:run -d ${DATA_SOURCE}`,
    'migration:revert': `NODE_ENV=local ${TS_NODE} ./node_modules/typeorm/cli.js migration:revert -d ${DATA_SOURCE}`
  },
  makeTargets: {
    migrate: '\tNODE_ENV=local npm run migration:run',
    'migrate-rollback': '\tNODE_ENV=local npm run migration:revert'
  },

  apply(tree: Tree, context: PluginContext): void {
    // Con migraciones, el esquema deja de materializarse al arrancar.
    const configPath = path.join(context.backendSrc, 'contexts/shared/infrastructure/config/environments')
    for (const env of tree.children(configPath)) {
      const file = path.join(configPath, env)
      const raw = tree.read(file, 'utf-8')
      if (!raw) {
        continue
      }
      const config = JSON.parse(raw) as { typeorm?: Record<string, unknown> }
      if (config.typeorm) {
        config.typeorm['synchronize'] = false
        tree.write(file, `${JSON.stringify(config, null, 2)}\n`)
      }
    }

    // Timestamp fijo (los generadores no pueden usar Date.now(): rompería la reproducibilidad)
    const stamp = 1790000000000
    const className = `InitialSchema${stamp}`
    const body = context.models.map(renderTable).join('\n\n')
    const drops = [...context.models]
      .reverse()
      .map(model => `    await queryRunner.query(\`DROP TABLE IF EXISTS ${model.schemaName}.${model.plural}\`)`)
      .join('\n')

    tree.write(
      path.join(context.backendSrc, MIGRATIONS_DIR, `${stamp}-InitialSchema.ts`),
      `import { MigrationInterface, QueryRunner } from 'typeorm'

/** Esquema inicial derivado de los modelos: ${context.models.map(m => m.plural).join(', ')}. */
export class ${className} implements MigrationInterface {
  name = '${className}'

  async up(queryRunner: QueryRunner): Promise<void> {
${body}
  }

  async down(queryRunner: QueryRunner): Promise<void> {
${drops}
  }
}
`
    )
  }
})

function renderTable(model: ResourceDefinition): string {
  const columns = Object.entries(model.fields).map(([name, field]) => renderColumn(model, name, field))
  if (model.audit) {
    columns.push(
      'created_at TIMESTAMPTZ NOT NULL DEFAULT now()',
      'updated_at TIMESTAMPTZ NOT NULL DEFAULT now()'
    )
  }
  if (model.softDelete) {
    columns.push('deleted_at TIMESTAMPTZ NULL')
  }

  const table = `${model.schemaName}.${model.plural}`
  const pk = Object.entries(model.fields).find(([, f]) => f.pk)?.[0] ?? 'id'
  columns.push(`CONSTRAINT pk_${model.plural} PRIMARY KEY (${snake(pk)})`)

  for (const [name, field] of Object.entries(model.fields)) {
    if (field.unique) {
      columns.push(`CONSTRAINT uq_${model.plural}_${snake(name)} UNIQUE (${snake(name)})`)
    }
  }

  const width = Math.max(...columns.map(c => c.split(' ')[0].length))
  const rendered = columns.map(c => `        ${c.split(' ')[0].padEnd(width)} ${c.split(' ').slice(1).join(' ')}`).join(',\n')

  return `    await queryRunner.query(\`CREATE SCHEMA IF NOT EXISTS ${model.schemaName}\`)

    await queryRunner.query(\`
      CREATE TABLE ${table} (
${rendered}
      )
    \`)`
}

function renderColumn(model: ResourceDefinition, name: string, field: FieldDefinition): string {
  const column = field.column
  const type = sqlType(model, field, column)
  const nullable = field.nullable ? 'NULL' : 'NOT NULL'
  const parts = [snake(name), type, nullable]

  if (column?.defaultRaw) {
    parts.push(`DEFAULT ${column.defaultRaw}`)
  } else if (column?.default !== undefined) {
    parts.push(`DEFAULT ${typeof column.default === 'string' ? `'${column.default}'` : String(column.default)}`)
  }
  return parts.join(' ')
}

function sqlType(model: ResourceDefinition, field: FieldDefinition, column?: ColumnDefinition): string {
  if (!column) {
    return field.type === 'uuid' ? 'UUID' : 'VARCHAR(255)'
  }
  switch (column.type) {
    case 'uuid':
      return 'UUID'
    case 'int':
    case 'integer':
      return 'INTEGER'
    case 'numeric':
      return `NUMERIC(${column.precision ?? 15}, ${column.scale ?? 2})`
    case 'timestamptz':
      return 'TIMESTAMPTZ'
    case 'date':
      return 'DATE'
    case 'boolean':
      return 'BOOLEAN'
    case 'text':
      return 'TEXT'
    default:
      return `VARCHAR(${columnLength(model, column)})`
  }
}

/** La longitud puede venir literal o por referencia a las constraints del recurso. */
function columnLength(model: ResourceDefinition, column: ColumnDefinition): number {
  if (column.length) {
    return column.length
  }
  if (!column.lengthConst) {
    return 255
  }
  const resolved = column.lengthConst.split('.').reduce<unknown>((acc, part) => {
    return acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined
  }, model.constraints)
  return typeof resolved === 'number' ? resolved : 255
}

function snake(value: string): string {
  return names(value).fileName.replace(/-/g, '_')
}
