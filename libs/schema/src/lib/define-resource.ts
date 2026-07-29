import { FieldDefinition, ResourceDefinition } from './resource-types'
import { SchemaValidationError } from './validation-errors'

const KEBAB_CASE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/
const SNAKE_CASE = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/

// Structural validation only (v1): rules grow with the templates, never ahead of them.
export function defineResource(definition: ResourceDefinition): ResourceDefinition {
  const problems = [...validateIdentity(definition), ...validateFields(definition)]

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
