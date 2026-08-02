import { FieldDefinition, ResourceDefinition } from './resource-types'
import { SchemaValidationError } from './validation-errors'

const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

// Structural validation only (v1): rules grow with the templates, never ahead of them.
export function defineResource(definition: ResourceDefinition): ResourceDefinition {
  const problems = [
    ...validateIdentity(definition),
    ...validateFields(definition),
    ...validateDetail(definition),
    ...validateGallery(definition),
    ...validateCode(definition)
  ]

  if (problems.length) throw new SchemaValidationError(definition.name, problems)

  return Object.freeze(definition)
}

function validateIdentity(definition: ResourceDefinition): string[] {
  const problems: string[] = []

  if (definition.schemaVersion !== 1) problems.push('schemaVersion: must be 1')

  for (const key of ['name', 'plural', 'context'] as const) {
    if (!KEBAB_CASE.test(definition[key])) problems.push(`${key}: must be non-empty kebab-case`)
  }
  if (!SNAKE_CASE.test(definition.schemaName)) problems.push('schemaName: must be non-empty snake_case')

  return problems
}

function validateFields(definition: ResourceDefinition): string[] {
  const problems: string[] = []

  const pkCount = Object.values(definition.fields).filter(f => f.pk).length
  if (pkCount !== 1) problems.push(`fields: exactly one field must declare pk (found ${pkCount})`)

  for (const [name, field] of Object.entries(definition.fields)) {
    problems.push(...validateField(name, field))
  }

  return problems
}

/**
 * La ficha se alcanza SOLO desde la acción de ver del listado, así que declararla
 * con esa acción apagada emitiría una pantalla inalcanzable (spec 16).
 */
function validateDetail(definition: ResourceDefinition): string[] {
  const { detail } = definition
  if (!detail) {
    // los adjuntos cuelgan de un registro y solo se ven en su ficha (spec 16)
    return definition.attachments ? ['attachments: requires detail (files belong to a record, shown in its detail)'] : []
  }

  const problems: string[] = []

  if (definition.list?.features?.view === false) {
    problems.push("detail: requires list.features.view (the detail is only reachable from the list's view action)")
  }
  for (const name of [...(detail.title ? [detail.title] : []), ...(detail.fields ?? [])]) {
    if (!definition.fields[name]) problems.push(`detail: unknown field '${name}'`)
  }

  return problems
}

/** La galería también se deriva de los campos: si se fija uno, debe existir (spec 17). */
function validateGallery(definition: ResourceDefinition): string[] {
  const { gallery } = definition
  if (!gallery) return []

  return [gallery.title, gallery.subtitle, gallery.metric]
    .filter((name): name is string => name !== undefined)
    .filter(name => !definition.fields[name])
    .map(name => `gallery: unknown field '${name}'`)
}

const CODE_PREFIX = /^[A-Z][A-Z0-9]{1,5}$/

/** El código es corto y legible: un prefijo largo o un relleno absurdo no lo son (spec 19). */
function validateCode(definition: ResourceDefinition): string[] {
  const { code } = definition
  if (!code) return []

  const problems: string[] = []

  if (code.prefix !== undefined && !CODE_PREFIX.test(code.prefix)) {
    problems.push(`code.prefix: must be 2-6 uppercase characters (got '${code.prefix}')`)
  }
  if (code.padding !== undefined && (code.padding < 2 || code.padding > 10)) {
    problems.push(`code.padding: must be between 2 and 10 (got ${code.padding})`)
  }
  if (definition.fields['code']) {
    problems.push("code: the resource already declares a 'code' field")
  }

  return problems
}

function validateField(name: string, field: FieldDefinition): string[] {
  const problems: string[] = []
  const at = `fields.${name}`

  if (field.table?.show && !field.table.label) {
    problems.push(`${at}: table.show requires table.label`)
  }
  if (field.form && field.form.control !== 'none' && !field.form.label) {
    problems.push(`${at}: form.control '${field.form.control}' requires form.label`)
  }
  if (field.relation) {
    if (!field.relation.to) problems.push(`${at}: relation.to must be non-empty`)
    if (!['reference', 'composition'].includes(field.relation.kind)) {
      problems.push(`${at}: relation.kind must be 'reference' or 'composition'`)
    }
  }
  if (field.column?.length !== undefined && field.column.lengthConst !== undefined) {
    problems.push(`${at}: column.length and column.lengthConst are mutually exclusive`)
  }
  if (field.column?.transformer === 'nullableNumeric' && !field.nullable) {
    problems.push(`${at}: column.transformer nullableNumeric requires nullable: true`)
  }
  if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
    problems.push(`${at}: min (${field.min}) must be <= max (${field.max})`)
  }

  return problems
}
