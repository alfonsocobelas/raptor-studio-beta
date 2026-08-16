import type { AccessDefinition, FieldDefinition, ResourceDefinition, StateMachine } from '@raptor/schema'

/**
 * Entidad DIBUJADA en el lienzo: lo mínimo que el usuario (o la IA) declara.
 * draftToResource la expande a un ResourceDefinition completo siguiendo los
 * patrones canónicos (VOs, constraints, columnas) — el usuario nunca ve esto.
 */
export type DraftFieldType =
  | 'string'
  | 'text'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  /** Identificador externo: el generador ya conoce la columna uuid */
  | 'uuid'
  | 'ref'
  | 'enum'

export interface DraftField {
  name: string
  label: string
  type: DraftFieldType
  /** Entidad referenciada cuando `type` es 'ref' (spec 15) */
  refTo?: string
  /** Conjunto cerrado de valores cuando `type` es 'enum' (spec 22) */
  values?: DraftEnumValue[]
  /** Valores de ejemplo REALISTAS para el mockup del lienzo (los aporta la IA; solo diseño) */
  samples?: (string | number | boolean)[]
}

/** Un valor de enum: el `value` va a la base, el `label` a la pantalla. */
export interface DraftEnumValue {
  value: string
  label: string
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
  /** La entidad se muestra como galería de tarjetas (spec 17) */
  gallery?: boolean
  /** Entradilla de la pantalla: el texto que la vista puso junto a la tabla (spec 18) */
  subtitle?: string
  /** Frase de negocio de la entidad, destilada del chat (spec 22) */
  brief?: string
  /** Máquina de estados: un campo enum promovido a estado con transiciones (spec 43) */
  state?: StateMachine
  /** Matriz de accesos actor→capacidad (spec 46); ausente = política actual */
  access?: AccessDefinition
}

export const DRAFT_FIELD_TYPES: DraftFieldType[] = [
  'string',
  'text',
  'number',
  'integer',
  'boolean',
  'date',
  'uuid',
  'ref',
  'enum'
]

/**
 * Los tipos que se OFRECEN al elegir el tipo de un campo. `ref` no está: una
 * referencia no se elige como tipo, se elige diciendo a qué entidad apunta, y
 * eso vive en su propio control junto al nombre y al tipo.
 */
export const SELECTABLE_FIELD_TYPES: DraftFieldType[] = DRAFT_FIELD_TYPES.filter(type => type !== 'ref')

/**
 * Variantes de badge por POSICIÓN: el mismo diseño produce siempre los mismos
 * colores. Asignarlos por nombre de valor los haría depender del idioma, y al
 * azar rompería el determinismo del generador.
 */
const BADGE_VARIANTS = ['default', 'secondary', 'outline', 'destructive'] as const

/**
 * «Vehículo» → vehiculo/vehiculos · «Empleados» → empleado/empleados.
 * Pluralización naïf editable después (el chat real produce singular/plural correctos).
 */
export function newDraftResource(label: string): DraftResource {
  const raw = kebab(label)
  const { singular, plural } = spanishForms(raw)
  const trimmed = label.trim()
  const name = singular
  const singularLabel = looksPlural(raw) ? capitalizeLike(trimmed, singular) : trimmed

  return {
    name,
    plural,
    labelSingular: singularLabel,
    labelPlural: looksPlural(raw) ? trimmed : capitalizeLike(trimmed, plural),
    gender: 'm',
    fields: [{ name: 'nombre', label: 'Nombre', type: 'string' }]
  }
}

/**
 * Consonantes con las que una palabra castellana puede acabar en singular. Sirven
 * para decidir si un plural en «-es» viene de quitar «es» (propiedades →
 * propiedad) o solo la «s» (coches → coche): «coch» no es un final posible.
 */
const FINAL_CONSONANTS = ['d', 'l', 'n', 'r', 's', 'z', 'j', 'y']

/** Un texto que acaba en «s» se toma por plural (heurística, no gramática completa). */
function looksPlural(kebab: string): boolean {
  return kebab.endsWith('s') && kebab.length > 3
}

/**
 * Singular y plural en castellano (hallazgo 20). Antes se quitaba o añadía una
 * «s» a secas, y «Propiedades» daba la entidad `propiedade`. La regla real es la
 * inversa de cómo se forma el plural: «-es» tras consonante, «-s» tras vocal.
 */
function spanishForms(kebab: string): { singular: string; plural: string } {
  if (looksPlural(kebab)) {
    if (kebab.endsWith('es')) {
      const stem = kebab.slice(0, -2)
      // «propiedad», «animal», «mes» son finales válidos; «coch» no lo es
      if (FINAL_CONSONANTS.includes(stem.slice(-1))) {
        return { singular: stem, plural: kebab }
      }
    }
    return { singular: kebab.slice(0, -1), plural: kebab }
  }
  const last = kebab.slice(-1)
  const isVowel = ['a', 'e', 'i', 'o', 'u'].includes(last)
  return { singular: kebab, plural: isVowel ? `${kebab}s` : `${kebab}es` }
}

/** Recorta o alarga la etiqueta escrita para que case con la forma calculada. */
function capitalizeLike(label: string, form: string): string {
  const head = label.slice(0, 1).toUpperCase()
  const rest = form.slice(1)
  return `${head}${rest}`
}

export function draftToResource(
  draft: DraftResource,
  appName: string,
  others: DraftResource[] = []
): ResourceDefinition {
  const className = pascal(draft.name)
  const constraints: Record<string, Record<string, number>> = {}
  const fields: Record<string, FieldDefinition> = {
    id: { type: 'uuid', pk: true, query: { filterable: 1 } }
  }

  let stringSeen = false
  draft.fields.forEach((field, index) => {
    // Una referencia se expande al par canónico (contract.customerId): el id
    // gobierna la integridad y el nombre denormalizado es lo que el usuario ve
    // y por lo que busca. Nunca un campo suelto con el nombre del draft.
    if (field.type === 'ref') {
      // Sin destino no hay nada que expandir; el gate del diseño lo rechaza antes
      // de generar, así que aquí basta con no emitir un campo a medias.
      if (field.refTo) {
        // la etiqueta del selector es el campo de texto REAL del destino
        // (un vehículo se identifica por matrícula, no por «nombre»)
        const target = others.find(o => o.name === field.refTo)
        const labelField = target?.fields.find(f => f.type === 'string')?.name ?? 'nombre'
        Object.assign(fields, relationFields(field, field.refTo, index + 1, labelField))
        constraints[`${snake(field.name)}_NAME`] = { MAX: 200 }
      }
      return
    }
    if (field.type === 'enum') {
      // Sin valores no hay conjunto que cerrar; el gate lo rechaza antes de generar
      if (field.values?.length) {
        fields[field.name] = enumField(field, field.values, className, index + 1)
      }
      return
    }
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
      case 'uuid':
        fields[field.name] = {
          ...base,
          vo: { name: voName, fieldName: field.label },
          column: { type: 'uuid' }
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
    ...(draft.gallery ? { gallery: {} } : {}),
    schemaVersion: 1,
    name: draft.name,
    plural: draft.plural,
    context: kebab(appName),
    schemaName: snake(appName).toLowerCase(),
    sharedDomainAlias: '@app/shared/domain',
    labels: {
      singular: draft.labelSingular,
      plural: draft.labelPlural,
      gender: draft.gender,
      ...(draft.subtitle ? { subtitle: draft.subtitle } : {})
    },
    ...(draft.brief ? { brief: draft.brief } : {}),
    // la máquina viaja tal cual: los nombres de campo del draft son los del schema, y el
    // gate de defineResource (spec 43) valida aquí mismo que hable de valores reales
    ...(draft.state ? { state: draft.state } : {}),
    // la matriz de accesos también viaja tal cual (spec 46): el gate vigila roles y verbos
    ...(draft.access ? { access: draft.access } : {}),
    formSections: [{ id: 'general', title: `Datos de ${draft.labelSingular.toLowerCase()}` }],
    constraintsConst: `${snake(draft.name)}_CONSTRAINTS`,
    audit: true,
    constraints,
    fields,
    list: {
      ...(firstString
        ? { deleteLabelField: firstString.name, defaultSort: { field: firstString.name, dir: 'asc' as const } }
        : {}),
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

/** El par id + nombre denormalizado de una referencia (canon de contract.model.ts). */
/**
 * Enum (spec 22) al par canónico que ya emiten los módulos de oro: VO con la
 * union de valores, columna badge con su mapa y desplegable tipado con el primer
 * valor por defecto.
 */
function enumField(field: DraftField, values: DraftEnumValue[], className: string, order: number): FieldDefinition {
  const voName = `${className}${pascal(field.name)}`

  return {
    type: 'string',
    required: true,
    vo: { name: voName, fieldName: field.label, values: values.map(v => v.value) },
    column: { type: 'varchar', length: 40 },
    query: { sortable: order, filterable: order + 1 },
    table: {
      show: true,
      order,
      label: field.label,
      type: 'badge',
      filterable: true,
      minWidth: 140,
      badgeMap: Object.fromEntries(
        values.map((value, position) => [
          value.value,
          { label: value.label, variant: BADGE_VARIANTS[position % BADGE_VARIANTS.length] }
        ])
      )
    },
    form: {
      control: 'select',
      label: field.label,
      section: 'general',
      order,
      options: values.map(v => ({ value: v.value, label: v.label })),
      default: `'${values[0].value}'`
    },
    ...(field.samples?.length ? { samples: field.samples } : {})
  }
}

function relationFields(
  field: DraftField,
  refTo: string,
  order: number,
  labelField: string
): Record<string, FieldDefinition> {
  const idName = `${field.name}Id`
  const nameName = `${field.name}Name`

  return {
    [idName]: {
      type: 'uuid',
      required: true,
      query: { filterable: order + 10 },
      relation: { to: refTo, kind: 'reference' },
      form: {
        control: 'select',
        label: field.label,
        section: 'general',
        order,
        placeholder: `Seleccionar ${field.label.toLowerCase()}`,
        lookup: { resource: refTo, labelField, denormalizes: nameName }
      }
    },
    [nameName]: {
      type: 'string',
      required: true,
      query: { filterable: order + 11, sortable: order, searchable: order },
      table: { show: true, order, label: field.label, filterable: true, minWidth: 180 },
      column: { type: 'varchar', lengthConst: `${snake(field.name)}_NAME.MAX` },
      ...(field.samples?.length ? { samples: field.samples } : {})
    }
  }
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
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}
