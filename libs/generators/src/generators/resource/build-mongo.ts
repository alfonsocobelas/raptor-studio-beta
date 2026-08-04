import { names } from '@nx/devkit'
import type { FieldDefinition, FieldType, ResourceDefinition } from '@acc/schema'

/**
 * Bindings de la persistencia Mongoose de un recurso (spec 06). Toda la lógica vive aquí:
 * las plantillas solo interpolan (regla 8).
 *
 * El contrato del dominio NO cambia con el motor: un campo que en Postgres es
 * `@Column('varchar', { default: '' }) notes!: string` no puede volverse nullable en Mongo.
 * Por eso las reglas de abajo son las mismas de `build-substitutions.ts`, traducidas:
 *
 *   nullable          → { default: null }        (y tsType Nullable<…>)
 *   column.default    → { default: <literal> }
 *   required          → { required: true }
 *   pk                → no es campo del doc: vive en _id
 */

const MONGOOSE_TYPE: Record<FieldType, string> = {
  uuid: 'String',
  string: 'String',
  text: 'String',
  number: 'Number',
  integer: 'Number',
  boolean: 'Boolean',
  // date guarda la fecha ISO tal cual ('YYYY-MM-DD'), como la columna `date` de Postgres:
  // su primitive es un string en ambos motores, y un Date aquí desalinearía el contrato
  date: 'String',
  timestamptz: 'Date'
}

/** Igual que DEFAULT_TS_TYPE del canon TypeORM: el documento expone los mismos primitives. */
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

export interface MongoDocField {
  name: string
  /** Definición del campo tal cual va en el schema: `{ type: String, required: true }` */
  defSrc: string
  tsType: string
}

export interface MongoChildBindings {
  className: string
  fileName: string
  schemaConst: string
  /** Propiedad del documento padre que contiene el array embebido (p.ej. `contacts`) */
  childrenProp: string
  /** Nombre en singular para variables de plantilla (p.ej. `contact`) */
  childProp: string
  /** Clave del padre que el subdocumento NO guarda y el mapper debe reponer (p.ej. `customerId`) */
  parentField: string
  docFields: MongoDocField[]
  toDomainProps: string[]
  toPersistenceProps: string[]
}

export interface MongoBindings {
  schemaConst: string
  collection: string
  docFields: MongoDocField[]
  /** Índices únicos, uno por línea, listos para interpolar tras el schema */
  indexLines: string[]
  toDomainProps: string[]
  toPersistenceProps: string[]
  /** Hijos de composición: subdocumentos embebidos. Null si el agregado no compone. */
  child: MongoChildBindings | null
  needsNullable: boolean
}

export function renderMongo(definition: ResourceDefinition): MongoBindings {
  const fields = Object.entries(definition.fields)
  const docFields = fields.filter(([, field]) => !field.pk).map(([name, field]) => renderDocField(name, field))
  const child = renderChild(definition)

  return {
    schemaConst: `${names(definition.name).className}Schema`,
    collection: definition.plural,
    docFields,
    indexLines: renderIndexLines(definition),
    toDomainProps: fields.map(([name, field]) => renderToDomainProp(name, field)),
    toPersistenceProps: fields.map(([name, field]) => renderToPersistenceProp(name, field)),
    child,
    needsNullable: [...docFields, ...(child?.docFields ?? [])].some(f => f.tsType.includes('Nullable<'))
  }
}

function renderDocField(name: string, field: FieldDefinition): MongoDocField {
  return {
    name,
    defSrc: `{ ${['type: ' + MONGOOSE_TYPE[field.type], ...renderDocOptions(field)].join(', ')} }`,
    tsType: field.column?.tsType ?? DEFAULT_TS_TYPE[field.type]
  }
}

function renderDocOptions(field: FieldDefinition): string[] {
  if (field.nullable) {
    return ['default: null']
  }
  if (field.column?.default !== undefined) {
    return [`default: ${renderLiteral(field.column.default)}`]
  }
  if (field.required) {
    return ['required: true']
  }
  return []
}

/**
 * Unicidad. Un único obligatorio es un índice único normal; uno opcional necesita
 * `partialFilterExpression` para no chocar entre sí en los documentos que lo traen
 * vacío — el equivalente al partial unique index de Postgres.
 */
function renderIndexLines(definition: ResourceDefinition): string[] {
  const schemaConst = `${names(definition.name).className}Schema`
  return Object.entries(definition.fields)
    .filter(([, field]) => field.unique)
    .map(([name, field]) => {
      if (field.required) {
        return `${schemaConst}.index({ ${name}: 1 }, { unique: true })`
      }
      const present = MONGOOSE_TYPE[field.type] === 'String' ? "{ $gt: '' }" : '{ $ne: null }'
      return `${schemaConst}.index({ ${name}: 1 }, { unique: true, partialFilterExpression: { ${name}: ${present} } })`
    })
}

function isNullableDate(field: FieldDefinition): boolean {
  return field.column?.tsType === 'Nullable<Date>'
}

function renderToDomainProp(name: string, field: FieldDefinition): string {
  if (field.pk) {
    return `id: doc._id`
  }
  if (isNullableDate(field)) {
    return `${name}: doc.${name}?.toISOString() ?? null`
  }
  return `${name}: doc.${name}`
}

function renderToPersistenceProp(name: string, field: FieldDefinition): string {
  if (field.pk) {
    return `_id: primitives.${name}`
  }
  if (isNullableDate(field)) {
    return `${name}: primitives.${name} ? new Date(primitives.${name}) : null`
  }
  if (field.optionalPrimitive || field.syncManaged) {
    const fallback = field.column?.default !== undefined ? renderLiteral(field.column.default) : 'null'
    return `${name}: primitives.${name} ?? ${fallback}`
  }
  return `${name}: primitives.${name}`
}

/**
 * Hijos de composición como subdocumentos embebidos: no tienen `_id` propio ni la clave
 * del padre — el documento del padre ya los contiene. Su `id` sí viaja como campo, porque
 * el agregado lo usa para identificarlos dentro de la colección embebida.
 */
function renderChild(definition: ResourceDefinition): MongoChildBindings | null {
  const composition = definition.composition
  if (!composition) {
    return null
  }
  const child = names(composition.name)
  const fields = Object.entries(composition.fields).filter(([name]) => name !== composition.parentField)

  return {
    className: child.className,
    fileName: child.fileName,
    schemaConst: `${child.className}Schema`,
    childrenProp: composition.plural,
    childProp: child.propertyName,
    parentField: composition.parentField,
    docFields: fields.map(([name, field]) => renderChildDocField(name, field)),
    // Al volver al dominio hay que REPONER la clave del padre: no está en el subdocumento
    // (el documento padre ya lo contiene), pero los primitives del hijo la exigen.
    toDomainProps: fields.map(([name]) => `${name}: doc.${name}`),
    toPersistenceProps: fields.map(([name, field]) => renderChildPersistenceProp(name, field))
  }
}

/**
 * El hijo no declara `column:` en el modelo: sus defaults los deriva el canon
 * (`childEntityColumn` de build-composition.ts) — booleanos a false, strings opcionales a ''.
 */
function renderChildDocField(name: string, field: FieldDefinition): MongoDocField {
  const type = MONGOOSE_TYPE[field.type]
  const options =
    field.type === 'boolean'
      ? ['default: false']
      : field.required || name === 'id'
        ? ['required: true']
        : ["default: ''"]

  return { name, defSrc: `{ ${['type: ' + type, ...options].join(', ')} }`, tsType: DEFAULT_TS_TYPE[field.type] }
}

function renderChildPersistenceProp(name: string, field: FieldDefinition): string {
  if (field.type === 'boolean' || field.required || name === 'id') {
    return `${name}: primitives.${name}`
  }
  return `${name}: primitives.${name} ?? ''`
}

function renderLiteral(value: string | number | boolean): string {
  return typeof value === 'string' ? `'${value}'` : String(value)
}
