import { names, type Tree } from '@nx/devkit'
import * as path from 'path'
import { ColumnDefinition, FieldDefinition, ResourceDefinition, wantsSoftDelete } from '@raptor/schema'
import { byDependency } from '../dependency-order'
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
    const ordered = byDependency(context.models)
    const body = [
      ...ordered.map(model =>
        [
          renderTable(model, context.models),
          ...(model.composition ? [renderCompositionTable(model)] : []),
          ...(model.attachments ? [renderAttachmentsTable(model)] : [])
        ].join('\n\n')
      ),
      // el historial (spec 31) usa una tabla GLOBAL: una por app, venga de los modelos que venga
      ...(context.models.some(model => model.history) ? [renderAuditTable()] : [])
    ].join('\n\n')
    const drops = [
      ...(context.models.some(model => model.history)
        ? ['    await queryRunner.query(`DROP TABLE IF EXISTS shared.audit_events`)']
        : []),
      ...[...ordered].reverse().flatMap(model => [
        ...(model.attachments
          ? [`    await queryRunner.query(\`DROP TABLE IF EXISTS ${model.schemaName}.${model.plural}_attachments\`)`]
          : []),
        ...(model.composition
          ? [`    await queryRunner.query(\`DROP TABLE IF EXISTS ${model.schemaName}.${model.composition.plural}\`)`]
          : []),
        `    await queryRunner.query(\`DROP TABLE IF EXISTS ${model.schemaName}.${model.plural}\`)`,
        ...(model.code
          ? [
              `    await queryRunner.query(\`DROP SEQUENCE IF EXISTS ${model.schemaName}.${model.plural}_code_seq\`)`
            ]
          : [])
      ])
    ].join('\n')

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

function renderTable(model: ResourceDefinition, all: ResourceDefinition[] = []): string {
  const columns = Object.entries(model.fields).map(([name, field]) => renderColumn(model, name, field))
  if (model.audit) {
    columns.push('created_at TIMESTAMPTZ NOT NULL DEFAULT now()', 'updated_at TIMESTAMPTZ NOT NULL DEFAULT now()')
  }
  if (wantsSoftDelete(model)) {
    // deleted_op: la operación que archivó la fila (spec 38). La escribe el caso de uso,
    // nunca un trigger — la base protege, no gobierna.
    columns.push('deleted_at TIMESTAMPTZ NULL', 'deleted_op UUID NULL')
  }

  const table = `${model.schemaName}.${model.plural}`
  const pk = Object.entries(model.fields).find(([, f]) => f.pk)?.[0] ?? 'id'
  columns.push(`CONSTRAINT pk_${model.plural} PRIMARY KEY (${snake(pk)})`)

  // Claves ajenas de las referencias (spec 15): sin ellas la base acepta hijos de
  // padres inexistentes. RESTRICT y no CASCADE: borrar un agente con propiedades
  // debe fallar, no llevárselas por delante — eso es decisión de negocio.
  const foreignKeys: string[] = []
  for (const [name, field] of Object.entries(model.fields)) {
    if (field.relation?.kind !== 'reference') {
      continue
    }
    const parent = all.find(candidate => candidate.name === field.relation?.to)
    if (!parent) {
      continue
    }
    const column = snake(name)
    columns.push(
      `CONSTRAINT fk_${model.plural}_${snake(parent.name)} FOREIGN KEY (${column}) ` +
        `REFERENCES ${parent.schemaName}.${parent.plural} (id) ON DELETE RESTRICT`
    )
    foreignKeys.push(`    await queryRunner.query(\`
      CREATE INDEX idx_${model.plural}_${column} ON ${table} (${column})
    \`)`)
  }

  // unicidad ifPresent (decisión 2026-07-30): los uniques opcionales van como índice único
  // parcial (canon uq_customers_tax_id) para que dos filas con el valor vacío convivan.
  const partialIndexes: string[] = []
  for (const [name, field] of Object.entries(model.fields)) {
    if (!field.unique) {
      continue
    }
    if (isOptionalUnique(field)) {
      partialIndexes.push(`    await queryRunner.query(\`
      CREATE UNIQUE INDEX uq_${model.plural}_${snake(name)}
        ON ${table} (${snake(name)})
        WHERE ${snake(name)} <> ''
    \`)`)
    } else {
      columns.push(`CONSTRAINT uq_${model.plural}_${snake(name)} UNIQUE (${snake(name)})`)
    }
  }

  const width = Math.max(...columns.map(c => c.split(' ')[0].length))
  const rendered = columns
    .map(c => `        ${c.split(' ')[0].padEnd(width)} ${c.split(' ').slice(1).join(' ')}`)
    .join(',\n')

  // La secuencia va ANTES de la tabla: es independiente de ella (no la referencia), pero
  // dejarlas juntas mantiene legible qué contador pertenece a qué entidad.
  const sequence = model.code
    ? [`    await queryRunner.query(\`CREATE SEQUENCE ${table}_code_seq\`)`]
    : []

  return [
    `    await queryRunner.query(\`CREATE SCHEMA IF NOT EXISTS ${model.schemaName}\`)`,
    ...sequence,
    `    await queryRunner.query(\`
      CREATE TABLE ${table} (
${rendered}
      )
    \`)`,
    ...foreignKeys,
    ...partialIndexes
  ].join('\n\n')
}

/**
 * Tabla del hijo de composición (B3): vive en el mismo esquema que su agregado.
 * FK en cascada (los hijos son del padre) y deleted_at SIEMPRE: el save del
 * agregado soft-borra por diff los hijos que ya no viven en él.
 */
function renderCompositionTable(model: ResourceDefinition): string {
  const comp = model.composition
  if (!comp) {
    return ''
  }
  const table = `${model.schemaName}.${comp.plural}`
  const parentColumn = snake(comp.parentField)

  const columns = Object.entries(comp.fields).map(([name, field]) => renderColumn(model, name, field))
  // la FK del padre no viaja en comp.fields (la entidad la declara aparte): va tras el id
  if (!comp.fields[comp.parentField]) {
    columns.splice(1, 0, `${parentColumn} UUID NOT NULL`)
  }
  columns.push('deleted_at TIMESTAMPTZ NULL')
  columns.push(`CONSTRAINT pk_${comp.plural} PRIMARY KEY (id)`)
  columns.push(
    `CONSTRAINT fk_${comp.plural}_${snake(model.name)} FOREIGN KEY (${parentColumn}) ` +
      `REFERENCES ${model.schemaName}.${model.plural} (id) ON DELETE CASCADE`
  )

  const width = Math.max(...columns.map(c => c.split(' ')[0].length))
  const rendered = columns
    .map(c => `        ${c.split(' ')[0].padEnd(width)} ${c.split(' ').slice(1).join(' ')}`)
    .join(',\n')

  return `    await queryRunner.query(\`
      CREATE TABLE ${table} (
${rendered}
      )
    \`)

    await queryRunner.query(\`
      CREATE INDEX idx_${comp.plural}_${parentColumn} ON ${table} (${parentColumn})
    \`)`
}

/**
 * Tabla GLOBAL de eventos de auditoría (spec 31): una por app, en su propio esquema
 * `shared`. Los use cases la alimentan vía AuditTrailPort; la ficha la lee.
 */
function renderAuditTable(): string {
  return `    await queryRunner.query(\`CREATE SCHEMA IF NOT EXISTS shared\`)

    await queryRunner.query(\`
      CREATE TABLE shared.audit_events (
        id          UUID         NOT NULL,
        entity      VARCHAR(100) NOT NULL,
        entity_id   UUID         NOT NULL,
        action      VARCHAR(20)  NOT NULL,
        changes     JSONB        NOT NULL DEFAULT '{}',
        occurred_at TIMESTAMPTZ  NOT NULL,
        actor       VARCHAR(255) NULL,
        CONSTRAINT pk_audit_events PRIMARY KEY (id)
      )
    \`)

    await queryRunner.query(\`
      CREATE INDEX idx_audit_events_entity ON shared.audit_events (entity, entity_id, occurred_at DESC)
    \`)`
}

/** Tabla de adjuntos (spec 14): metadatos del fichero; el binario vive en FileStoragePort. */
function renderAttachmentsTable(model: ResourceDefinition): string {
  const table = `${model.schemaName}.${model.plural}_attachments`
  const owner = `${snake(model.name)}_id`
  // Los adjuntos son del registro: FK con borrado en cascada, para que borrar el
  // registro no deje metadatos huérfanos apuntando a blobs que ya nadie reclama.
  return `    await queryRunner.query(\`
      CREATE TABLE ${table} (
        id          UUID         NOT NULL,
        ${owner} UUID         NOT NULL,
        file_name   VARCHAR(255) NOT NULL,
        mime_type   VARCHAR(128) NOT NULL,
        size_bytes  INT          NOT NULL,
        storage_key UUID         NOT NULL,
        uploaded_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT pk_${model.plural}_attachments PRIMARY KEY (id),
        CONSTRAINT fk_${model.plural}_attachments_${snake(model.name)} FOREIGN KEY (${owner})
          REFERENCES ${model.schemaName}.${model.plural} (id) ON DELETE CASCADE
      )
    \`)

    await queryRunner.query(\`
      CREATE INDEX idx_${model.plural}_attachments_${owner} ON ${table} (${owner})
    \`)

    await queryRunner.query(\`
      CREATE INDEX idx_${model.plural}_attachments_file_name ON ${table} (file_name)
    \`)`
}

/** Unique opcional (semántica ifPresent): string no requerido y no nullable, como el taxId del canon. */
function isOptionalUnique(field: FieldDefinition): boolean {
  return field.required !== true && !(field.nullable ?? false) && field.type === 'string'
}

function renderColumn(model: ResourceDefinition, name: string, field: FieldDefinition): string {
  const column = field.column
  const type = sqlType(model, field, column)
  const nullable = field.nullable ? 'NULL' : 'NOT NULL'
  const parts = [snake(name), type, nullable]

  if (column?.defaultRaw) {
    // defaultRaw viaja listo para la entidad TS (`default: () => "'{}'"`); en SQL las comillas
    // dobles del literal TS serían una referencia a columna y Postgres aborta la migración
    parts.push(`DEFAULT ${column.defaultRaw.replace(/^"(.*)"$/, '$1')}`)
  } else if (column?.default !== undefined) {
    parts.push(`DEFAULT ${typeof column.default === 'string' ? `'${column.default}'` : String(column.default)}`)
  }
  return parts.join(' ')
}

function sqlType(model: ResourceDefinition, field: FieldDefinition, column?: ColumnDefinition): string {
  if (!column) {
    // sin column declarado, manda el tipo del schema: un boolean como VARCHAR
    // rompería el INSERT parametrizado (pg no convierte bool → varchar)
    switch (field.type) {
      case 'uuid':
        return 'UUID'
      case 'boolean':
        return 'BOOLEAN'
      case 'integer':
        return 'INTEGER'
      case 'number':
        return 'NUMERIC(15, 2)'
      case 'date':
        return 'DATE'
      case 'timestamptz':
        return 'TIMESTAMPTZ'
      case 'text':
        return 'TEXT'
      default:
        return 'VARCHAR(255)'
    }
  }
  const array = column.array ? '[]' : ''
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
      return `TEXT${array}`
    default:
      return `VARCHAR(${columnLength(model, column)})${array}`
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
