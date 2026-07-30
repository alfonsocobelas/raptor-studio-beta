import { names } from '@nx/devkit'
import { ColumnDefinition, FieldDefinition, FieldType, ResourceDefinition } from '@acc/schema'

export interface ColumnSubstitution {
  name: string
  tsType: string
  decorator: 'Column' | 'PrimaryColumn'
  /** Pre-rendered decorator arguments, e.g. "'varchar', { length: 20, default: 'active' }" */
  argsSrc: string
  comment: string[]
}

export interface ResourceSubstitutions {
  className: string
  propertyName: string
  fileName: string
  constantName: string
  plural: string
  schemaName: string
  constraintsConst?: string
  audit: boolean
  needsNullable: boolean
  needsNumericTransformer: boolean
  needsNullableNumericTransformer: boolean
  /** Pre-rendered typeorm import list, e.g. "Column, Entity, PrimaryColumn" */
  typeormImports: string
  columns: ColumnSubstitution[]
  /** Ordered field-name lists for the search-config (numeric flags first, then booleans in field order) */
  allowedFilters: string[]
  allowedOrders: string[]
  searchableFields: string[]
  searchNotes: string[]
  /** Pre-rendered lines for <name>-constants.ts, e.g. "CMS_CASE_ID: { MAX: 30 }" */
  constraintEntries: string[]
  hasSharedConstraints: boolean
  /** Pre-rendered mapper lines */
  toDomainProps: string[]
  toPersistenceLines: string[]
}

// Defaults derived from the schema field type; column.type / column.tsType override them.
const DEFAULT_COLUMN_TYPE: Record<FieldType, string> = {
  uuid: 'uuid',
  string: 'varchar',
  text: 'text',
  number: 'numeric',
  integer: 'int',
  boolean: 'boolean',
  date: 'date',
  timestamptz: 'timestamptz'
}

const DEFAULT_TS_TYPE: Record<FieldType, string> = {
  uuid: 'string',
  string: 'string',
  text: 'string',
  number: 'number',
  integer: 'number',
  boolean: 'boolean',
  date: 'string',
  timestamptz: 'Date'
}

// All rendering logic lives here on purpose: templates stay dumb (project rule #8).
export function buildSubstitutions(definition: ResourceDefinition): ResourceSubstitutions {
  const n = names(definition.name)
  const fields = Object.entries(definition.fields)
  const columns = fields.map(([name, field]) => renderColumn(name, field))

  return {
    className: n.className,
    propertyName: n.propertyName,
    fileName: n.fileName,
    constantName: n.constantName,
    plural: definition.plural,
    schemaName: definition.schemaName,
    constraintsConst: definition.constraintsConst,
    audit: definition.audit ?? false,
    needsNullable: columns.some(c => c.tsType.includes('Nullable<')),
    needsNumericTransformer: fields.some(([, f]) => f.column?.transformer === 'numeric'),
    needsNullableNumericTransformer: fields.some(([, f]) => f.column?.transformer === 'nullableNumeric'),
    typeormImports: renderTypeormImports(definition),
    columns,
    allowedFilters: orderedQueryList(fields, 'filterable'),
    allowedOrders: orderedQueryList(fields, 'sortable'),
    searchableFields: orderedQueryList(fields, 'searchable'),
    searchNotes: definition.searchNotes ?? [],
    constraintEntries: renderConstraints(definition),
    hasSharedConstraints: Object.values(definition.constraints ?? {}).some(v => 'shared' in v),
    toDomainProps: fields.map(([name, f]) => renderToDomainProp(name, f)),
    toPersistenceLines: fields.map(([name, f]) => renderToPersistenceLine(name, f))
  }
}

type QueryFlag = 'filterable' | 'sortable' | 'searchable'

function orderedQueryList(fields: [string, FieldDefinition][], flag: QueryFlag): string[] {
  const flagged = fields
    .map(([name, f], index) => ({ name, value: f.query?.[flag], index }))
    .filter(e => e.value !== undefined && e.value !== false)
  return flagged
    .sort((a, b) => {
      const av = typeof a.value === 'number' ? a.value : Number.MAX_SAFE_INTEGER + a.index
      const bv = typeof b.value === 'number' ? b.value : Number.MAX_SAFE_INTEGER + b.index
      return av - bv
    })
    .map(e => e.name)
}

function renderConstraints(definition: ResourceDefinition): string[] {
  return Object.entries(definition.constraints ?? {}).map(([key, value]) => {
    if ('shared' in value) return `${key}: SHARED_CONSTRAINTS.${key}`
    const entries = Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ')
    return `${key}: { ${entries} }`
  })
}

function isNullableDate(field: FieldDefinition): boolean {
  return field.column?.tsType === 'Nullable<Date>'
}

function renderToDomainProp(name: string, field: FieldDefinition): string {
  if (isNullableDate(field)) return `${name}: entity.${name}?.toISOString() ?? null`
  return `${name}: entity.${name}`
}

function renderToPersistenceLine(name: string, field: FieldDefinition): string {
  if (isNullableDate(field)) {
    return `entity.${name} = primitives.${name} ? new Date(primitives.${name}) : null`
  }
  if (field.optionalPrimitive) {
    const fallback = field.column?.default !== undefined ? renderLiteral(field.column.default) : 'null'
    return `entity.${name} = primitives.${name} ?? ${fallback}`
  }
  return `entity.${name} = primitives.${name}`
}

function renderTypeormImports(definition: ResourceDefinition): string {
  const fields = Object.values(definition.fields)
  const imports = ['Entity']
  if (fields.some(f => f.pk)) imports.push('PrimaryColumn')
  if (fields.some(f => !f.pk)) imports.push('Column')
  if (definition.audit) imports.push('CreateDateColumn', 'UpdateDateColumn')
  return imports.sort().join(', ')
}

function renderColumn(name: string, field: FieldDefinition): ColumnSubstitution {
  const columnType = field.column?.type ?? DEFAULT_COLUMN_TYPE[field.type]
  const optionsSrc = renderOptions(field)

  return {
    name,
    tsType: field.column?.tsType ?? DEFAULT_TS_TYPE[field.type],
    decorator: field.pk ? 'PrimaryColumn' : 'Column',
    argsSrc: optionsSrc ? `'${columnType}', ${optionsSrc}` : `'${columnType}'`,
    comment: field.comment ?? []
  }
}

// Entries are emitted in the reference codebase's property order so the golden diff stays empty.
function renderOptions(field: FieldDefinition): string | undefined {
  const column: ColumnDefinition | undefined = field.column
  const entries: string[] = []

  if (column?.length !== undefined) entries.push(`length: ${column.length}`)
  if (column?.lengthConst !== undefined) entries.push(`length: LIMITS.${column.lengthConst}`)
  if (column?.precision !== undefined) entries.push(`precision: ${column.precision}`)
  if (column?.scale !== undefined) entries.push(`scale: ${column.scale}`)
  if (column?.array) entries.push('array: true')
  if (field.nullable) entries.push('nullable: true')
  if (column?.default !== undefined) entries.push(`default: ${renderLiteral(column.default)}`)
  if (column?.defaultRaw !== undefined) entries.push(`default: () => ${column.defaultRaw}`)
  if (column?.transformer === 'numeric') entries.push('transformer: numericTransformer')
  if (column?.transformer === 'nullableNumeric') entries.push('transformer: nullableNumericTransformer')

  return entries.length ? `{ ${entries.join(', ')} }` : undefined
}

function renderLiteral(value: string | number | boolean): string {
  return typeof value === 'string' ? `'${value}'` : String(value)
}
