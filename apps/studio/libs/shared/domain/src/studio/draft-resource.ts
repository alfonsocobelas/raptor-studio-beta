import type { FieldDefinition, ResourceDefinition } from '@acc/schema'

/**
 * Entidad DIBUJADA en el lienzo: lo mínimo que el usuario (o la IA) declara.
 * draftToResource la expande a un ResourceDefinition completo siguiendo los
 * patrones canónicos (VOs, constraints, columnas) — el usuario nunca ve esto.
 */
export type DraftFieldType = 'string' | 'text' | 'number' | 'integer' | 'boolean' | 'date'

export interface DraftField {
  name: string
  label: string
  type: DraftFieldType
  /** Valores de ejemplo REALISTAS para el mockup del lienzo (los aporta la IA; solo diseño) */
  samples?: (string | number | boolean)[]
}

export interface DraftResource {
  name: string
  plural: string
  labelSingular: string
  labelPlural: string
  gender: 'm' | 'f'
  fields: DraftField[]
  /** La vista de la entidad incluye el componente de subida de ficheros (spec 14) */
  attachments?: boolean
  /** La entidad tiene ficha de registro (spec 16) */
  detail?: boolean
}

export const DRAFT_FIELD_TYPES: DraftFieldType[] = ['string', 'text', 'number', 'integer', 'boolean', 'date']

/**
 * «Vehículo» → vehiculo/vehiculos · «Empleados» → empleado/empleados.
 * Pluralización naïf editable después (el chat real produce singular/plural correctos).
 */
export function newDraftResource(label: string): DraftResource {
  const raw = kebab(label)
  const alreadyPlural = raw.endsWith('s') && raw.length > 2
  const name = alreadyPlural ? raw.slice(0, -1) : raw
  const plural = alreadyPlural ? raw : `${raw}s`
  const singularLabel = alreadyPlural ? label.trim().slice(0, -1) : label.trim()
  return {
    name,
    plural,
    labelSingular: singularLabel,
    labelPlural: alreadyPlural ? label.trim() : `${label.trim()}s`,
    gender: 'm',
    fields: [{ name: 'nombre', label: 'Nombre', type: 'string' }]
  }
}

export function draftToResource(draft: DraftResource, appName: string): ResourceDefinition {
  const className = pascal(draft.name)
  const constraints: Record<string, Record<string, number>> = {}
  const fields: Record<string, FieldDefinition> = {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } }
  }

  let stringSeen = false
  draft.fields.forEach((field, index) => {
    const isNameField = field.type === 'string' && !stringSeen
    if (field.type === 'string') stringSeen = true
    const key = snake(field.name)
    const voName = `${className}${pascal(field.name)}`
    const order = index + 1
    const base: FieldDefinition = {
      type: field.type === 'text' ? 'string' : field.type,
      form: {
        control:
          field.type === 'text'
            ? 'textarea'
            : field.type === 'number' || field.type === 'integer'
              ? 'number'
              : field.type === 'boolean'
                ? 'checkbox'
                : field.type === 'date'
                  ? 'date'
                  : 'text',
        label: field.label,
        section: 'general',
        order,
        ...(field.type === 'text' ? { rows: 3, fullWidth: true } : {})
      },
      table: {
        show: true,
        order,
        label: field.label,
        ...(field.type === 'number' || field.type === 'integer' ? { type: 'number' as const } : {}),
        ...(field.type === 'date' ? { type: 'date' as const } : {}),
        minWidth: 120
      },
      query: { sortable: order, ...(isNameField ? { filterable: 2, searchable: 1 } : {}) },
      // los ejemplos del diseño viajan al generador: las semillas dejan de ser «Nombre seed 1»
      ...(field.samples?.length ? { samples: field.samples } : {})
    }

    switch (field.type) {
      case 'string':
        constraints[key] = isNameField ? { MIN: 2, MAX: 200 } : { MAX: 200 }
        fields[field.name] = {
          ...base,
          ...(isNameField ? { required: true } : {}),
          vo: {
            name: voName,
            fieldName: field.label,
            ...(isNameField ? { ensure: 'string' as const, minLength: true } : {}),
            lengthRule: 'max',
            constraintKey: key
          },
          column: { type: 'varchar', lengthConst: `${key}.MAX`, ...(isNameField ? {} : { default: '' }) }
        }
        break
      case 'text':
        constraints[key] = { MAX: 2000 }
        fields[field.name] = {
          ...base,
          vo: { name: voName, fieldName: field.label, lengthRule: 'max', constraintKey: key },
          column: { type: 'varchar', lengthConst: `${key}.MAX`, default: '' }
        }
        break
      case 'integer':
        constraints[key] = { MIN: 0 }
        fields[field.name] = {
          ...base,
          required: true,
          vo: { name: voName, fieldName: field.label, min: true, constraintKey: key },
          column: { type: 'int', default: 0 }
        }
        break
      case 'number':
        constraints[key] = { MIN: 0 }
        fields[field.name] = {
          ...base,
          required: true,
          vo: { name: voName, fieldName: field.label, min: true, constraintKey: key },
          column: { type: 'numeric', precision: 15, scale: 2, default: 0, transformer: 'numeric' }
        }
        break
      case 'boolean':
        fields[field.name] = {
          ...base,
          required: true,
          vo: { name: voName, fieldName: field.label },
          column: { type: 'boolean', default: false }
        }
        break
      case 'date':
        fields[field.name] = {
          ...base,
          required: true,
          vo: { name: voName, fieldName: field.label },
          column: { type: 'date', tsType: 'string' }
        }
        break
    }
  })

  const firstString = draft.fields.find(f => f.type === 'string')
  // los adjuntos viven DENTRO de la ficha, así que la arrastran consigo
  const hasDetail = Boolean(draft.detail || draft.attachments)
  return {
    ...(draft.attachments ? { attachments: true } : {}),
    ...(hasDetail ? { detail: {} } : {}),
    schemaVersion: 1,
    name: draft.name,
    plural: draft.plural,
    context: kebab(appName),
    schemaName: snake(appName).toLowerCase(),
    sharedDomainAlias: '@app/shared/domain',
    labels: { singular: draft.labelSingular, plural: draft.labelPlural, gender: draft.gender },
    formSections: [{ id: 'general', title: `Datos de ${draft.labelSingular.toLowerCase()}` }],
    constraintsConst: `${snake(draft.name)}_CONSTRAINTS`,
    audit: true,
    constraints,
    fields,
    list: {
      ...(firstString ? { deleteLabelField: firstString.name, defaultSort: { field: firstString.name, dir: 'asc' as const } } : {}),
      // la acción «ver» solo se ofrece si hay ficha a la que ir (spec 16)
      features: {
        create: true,
        export: ['csv' as const],
        search: Boolean(firstString),
        view: hasDetail,
        edit: true,
        delete: true
      }
    }
  } as unknown as ResourceDefinition
}

function kebab(s: string): string {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function snake(s: string): string {
  return kebab(s).replace(/-/g, '_').toUpperCase()
}

function pascal(s: string): string {
  return kebab(s)
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('')
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
