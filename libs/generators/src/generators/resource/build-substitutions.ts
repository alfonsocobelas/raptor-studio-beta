import { names } from '@nx/devkit'
import {
  ColumnDefinition,
  ConstraintValue,
  FieldDefinition,
  FieldTable,
  FieldType,
  ResourceDefinition
} from '@acc/schema'

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
  auditComment: boolean
  softDelete: boolean
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
  /** ALLOWED_FILTERS entries with their optional comment lines */
  filterEntries: { name: string; comment: string[] }[]
  searchNotes: string[]
  ordersNotes: string[]
  /** Pre-rendered lines for <name>-constants.ts, e.g. "CMS_CASE_ID: { MAX: 30 }" */
  constraintEntries: string[]
  /** Pre-rendered extra exported groups, e.g. "OBSERVABILITY_THRESHOLDS: { UNDERUSED_PCT: 40 }" */
  extraConstantBlocks: string[]
  hasSharedConstraints: boolean
  /** Pre-rendered mapper lines */
  toDomainProps: string[]
  toPersistenceLines: string[]
  /** Frontend bindings */
  route: string
  sharedDomainAlias: string
  ui: UiStrings
  /** Pre-rendered ColumnDef entries (badge columns expanded multiline, prettier preserves it) */
  frontendColumns: string[]
  /** Label consts referenced by valueMap columns (imported from ./<fileName>-labels) */
  valueMapImports: string[]
  features: { view: boolean; delete: boolean }
  /** lucide icons required by the enabled actions */
  icons: string[]
  deleteLabelField: string
}

export interface UiStrings {
  title: string
  subtitle: string
  loading: string
  error: string
  empty: string
  createLabel: string
  exportFilename: string
  toastCreated: string
  toastUpdated: string
  toastCreateError: string
  toastUpdateError: string
  viewLabel: string
  deleteTitle: string
  deleteDescriptionSubject: string
  toastDeleted: string
  toastDeleteError: string
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
    auditComment: definition.auditComment ?? false,
    softDelete: definition.softDelete ?? false,
    needsNullable: columns.some(c => c.tsType.includes('Nullable<')),
    needsNumericTransformer: fields.some(([, f]) => f.column?.transformer === 'numeric'),
    needsNullableNumericTransformer: fields.some(([, f]) => f.column?.transformer === 'nullableNumeric'),
    typeormImports: renderTypeormImports(definition),
    columns,
    allowedFilters: orderedQueryList(fields, 'filterable'),
    allowedOrders: orderedQueryList(fields, 'sortable'),
    searchableFields: orderedQueryList(fields, 'searchable'),
    filterEntries: orderedQueryList(fields, 'filterable').map(name => ({
      name,
      comment: definition.fields[name].query?.filterNote ?? []
    })),
    searchNotes: definition.searchNotes ?? [],
    ordersNotes: definition.ordersNotes ?? [],
    constraintEntries: renderConstraints(definition),
    extraConstantBlocks: Object.entries(definition.extraConstants ?? {}).map(
      ([key, group]) =>
        `${key}: { ${Object.entries(group)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')} }`
    ),
    hasSharedConstraints: Object.values(definition.constraints ?? {}).some(v => typeof v === 'object' && 'shared' in v),
    toDomainProps: fields.map(([name, f]) => renderToDomainProp(name, f)),
    toPersistenceLines: fields.map(([name, f]) => renderToPersistenceLine(name, f)),
    route: definition.route ?? `/${definition.context}/${definition.plural}`,
    sharedDomainAlias: definition.sharedDomainAlias ?? '@acc/shared/domain',
    ui: renderUiStrings(definition),
    frontendColumns: fields
      .filter(([, f]) => f.table?.show)
      .sort(([, a], [, b]) => (a.table?.order ?? Number.MAX_SAFE_INTEGER) - (b.table?.order ?? Number.MAX_SAFE_INTEGER))
      .map(([name, f]) => renderFrontendColumn(name, f.table as FieldTable)),
    valueMapImports: [
      ...new Set(fields.map(([, f]) => f.table?.valueMapConst).filter((c): c is string => c !== undefined))
    ],
    features: resolveFeatures(definition),
    icons: renderIcons(resolveFeatures(definition)),
    deleteLabelField: definition.list?.deleteLabelField ?? 'name'
  }
}

function resolveFeatures(definition: ResourceDefinition): { view: boolean; delete: boolean } {
  return {
    view: definition.list?.features?.view ?? true,
    delete: definition.list?.features?.delete ?? false
  }
}

function renderIcons(features: { view: boolean; delete: boolean }): string[] {
  const icons: string[] = []
  if (features.view) icons.push('lucideEye')
  icons.push('lucidePencil')
  if (features.delete) icons.push('lucideTrash2')
  return icons
}

function renderUiStrings(definition: ResourceDefinition): UiStrings {
  const labels = definition.labels ?? { singular: definition.name, plural: definition.plural }
  const singular = labels.singular
  const plural = labels.plural
  const lowerSingular = singular.toLowerCase()
  const lowerPlural = plural.toLowerCase()
  const feminine = labels.gender === 'f'
  const article = feminine ? 'la' : 'el'
  const suffix = feminine ? 'a' : 'o'

  return {
    title: plural,
    subtitle: labels.subtitle ?? '',
    loading: `Cargando ${lowerPlural}…`,
    error: `No se pudieron cargar ${feminine ? 'las' : 'los'} ${lowerPlural}`,
    empty: `No hay ${lowerPlural} registrad${suffix}s`,
    createLabel: `Nuev${suffix} ${lowerSingular}`,
    exportFilename: lowerPlural,
    toastCreated: `${singular} cread${suffix} correctamente`,
    toastUpdated: `${singular} actualizad${suffix} correctamente`,
    toastCreateError: `No se pudo crear ${article} ${lowerSingular}`,
    toastUpdateError: `No se pudo actualizar ${article} ${lowerSingular}`,
    viewLabel: definition.list?.viewLabel ?? 'Ver ficha',
    deleteTitle: `Eliminar ${lowerSingular}`,
    deleteDescriptionSubject: `${article} ${lowerSingular}`,
    toastDeleted: `${singular} eliminad${suffix}`,
    toastDeleteError: `No se pudo eliminar ${article} ${lowerSingular}`
  }
}

function renderFrontendColumn(name: string, table: FieldTable): string {
  const parts = [`key: '${name}'`, `label: '${table.label}'`]
  if (table.filterable) parts.push('filterable: true')
  if (table.sortable === false) parts.push('sortable: false')
  if (table.type === 'date' || table.type === 'number') parts.push(`type: '${table.type}'`)
  if (table.minWidth !== undefined) parts.push(`minWidth: ${table.minWidth}`)
  if (table.valueMapConst) parts.push(`valueMap: ${table.valueMapConst}`)
  if (table.type === 'badge' && table.badgeMap) {
    parts.push(`type: 'badge'`)
    const entries = Object.entries(table.badgeMap)
      .map(([key, badge]) => `      ${key}: { label: '${badge.label}', variant: '${badge.variant}' }`)
      .join(',\n')
    parts.push(`badgeMap: {\n${entries}\n    }`)
    // objeto expandido: prettier preserva la multilinea, como en el módulo de oro
    return `{\n    ${parts.join(',\n    ')}\n  }`
  }
  return `{ ${parts.join(', ')} }`
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
  return Object.entries(definition.constraints ?? {}).map(
    ([key, value]) => `${key}: ${renderConstraintValue(key, value)}`
  )
}

function renderConstraintValue(key: string, value: ConstraintValue): string {
  if (typeof value === 'number') return String(value)
  if ('shared' in value) return `SHARED_CONSTRAINTS.${value.shared === true ? key : value.shared}`
  const entries = Object.entries(value).map(
    ([k, v]) => `${k}: ${typeof v === 'number' ? v : renderConstraintValue(k, v)}`
  )
  const hasNestedGroups = Object.values(value).some(v => typeof v === 'object')
  // prettier preserva la expansión multilinea de objetos: los grupos anidados se emiten expandidos como en el canon
  if (hasNestedGroups) return `{\n    ${entries.join(',\n    ')}\n  }`
  return `{ ${entries.join(', ')} }`
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
  if (definition.softDelete) imports.push('DeleteDateColumn')
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
