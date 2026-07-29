import { names } from '@nx/devkit'
import { FieldColumnOptions, ResourceField, ResourceModel } from './models/model-types'

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
  columns: ColumnSubstitution[]
}

// All rendering logic lives here on purpose: templates stay dumb (project rule #8).
export function buildSubstitutions(model: ResourceModel): ResourceSubstitutions {
  const n = names(model.name)

  return {
    className: n.className,
    propertyName: n.propertyName,
    fileName: n.fileName,
    constantName: n.constantName,
    plural: model.plural,
    schemaName: model.schemaName,
    constraintsConst: model.constraintsConst,
    audit: model.audit ?? false,
    needsNullable: model.fields.some(f => f.tsType.includes('Nullable<')),
    needsNumericTransformer: model.fields.some(f => f.options?.transformer === 'numeric'),
    needsNullableNumericTransformer: model.fields.some(f => f.options?.transformer === 'nullableNumeric'),
    columns: model.fields.map(renderColumn)
  }
}

function renderColumn(field: ResourceField): ColumnSubstitution {
  const optionsSrc = renderOptions(field.options)

  return {
    name: field.name,
    tsType: field.tsType,
    decorator: field.pk ? 'PrimaryColumn' : 'Column',
    argsSrc: optionsSrc ? `'${field.column}', ${optionsSrc}` : `'${field.column}'`,
    comment: field.comment ?? []
  }
}

// Entries are emitted in the reference codebase's property order so the golden diff stays empty.
function renderOptions(options?: FieldColumnOptions): string | undefined {
  if (!options) return undefined

  const entries: string[] = []
  if (options.length !== undefined) entries.push(`length: ${options.length}`)
  if (options.lengthConst !== undefined) entries.push(`length: LIMITS.${options.lengthConst}`)
  if (options.precision !== undefined) entries.push(`precision: ${options.precision}`)
  if (options.scale !== undefined) entries.push(`scale: ${options.scale}`)
  if (options.array) entries.push('array: true')
  if (options.nullable) entries.push('nullable: true')
  if (options.default !== undefined) entries.push(`default: ${renderLiteral(options.default)}`)
  if (options.defaultRaw !== undefined) entries.push(`default: () => ${options.defaultRaw}`)
  if (options.transformer === 'numeric') entries.push('transformer: numericTransformer')
  if (options.transformer === 'nullableNumeric') entries.push('transformer: nullableNumericTransformer')

  return entries.length ? `{ ${entries.join(', ')} }` : undefined
}

function renderLiteral(value: string | number | boolean): string {
  return typeof value === 'string' ? `'${value}'` : String(value)
}
