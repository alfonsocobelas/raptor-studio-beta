import { names } from '@nx/devkit'
import { FieldDefinition, ResourceDefinition } from '@acc/schema'

/**
 * Domain test artifacts (spec 14 backend): repository port + object mother + builder +
 * repository mock, synthesized canonically. Sample values derive from column defaults
 * and field types (never hand-transcribed); unique string fields get a random helper.
 */
export interface DomainTestBindings {
  emit: boolean
  uniqueFinders: { method: string; param: string; voName: string; voFileName: string; shared: boolean; givenName: string }[]
  portImports: string[]
  builderImports: string[]
  builderDefaultLines: string[]
  builderWiths: { cap: string; name: string; tsType: string }[]
  builderCreateArgs: string[]
  randomHelpers: string[]
  motherUniqueShortcuts: { cap: string; name: string }[]
  voTests: {
    enums: { voName: string; valuesList: string; comment?: string }[]
    numbers: { voName: string; integer: boolean; unset: boolean; minKey: string }[]
    texts: { voName: string; maxKey: string; minKey: string | null; required: boolean; noInner: boolean; email: boolean }[]
    exacts: { voName: string; lengthKey: string }[]
    arrays: { voName: string }[]
    booleans: { voName: string }[]
    sanitizations: { voName: string; inner: boolean; minKey: string | null }[]
  }
}

interface Ctx {
  name: string
  field: FieldDefinition
  voName: string
  nullable: boolean
  sync: boolean
  maint: boolean
  unique: boolean
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function renderDomainTests(definition: ResourceDefinition): DomainTestBindings {
  const n = names(definition.name)
  const className = n.className
  const period = definition.period
  const periodFields = period ? [period.start, period.end] : []

  const ctxs: Ctx[] = Object.entries(definition.fields)
    .filter(([name]) => name !== 'id')
    .map(([name, field]) => ({
      name,
      field,
      voName: voName(field),
      nullable: field.nullable ?? false,
      sync: field.syncManaged ?? false,
      maint: (field.optionalPrimitive ?? false) && !(field.syncManaged ?? false),
      unique: field.unique ?? false
    }))

  if (!ctxs.some(c => typeof c.field.vo === 'object')) {
    return {
      emit: false,
      uniqueFinders: [],
      portImports: [],
      builderImports: [],
      builderDefaultLines: [],
      builderWiths: [],
      builderCreateArgs: [],
      randomHelpers: [],
      motherUniqueShortcuts: [],
      voTests: { enums: [], numbers: [], texts: [], exacts: [], arrays: [], booleans: [], sanitizations: [] }
    }
  }

  const uniques = ctxs.filter(c => c.unique && c.voName)
  const uniqueFinders = uniques.map(c => ({
    method: `findBy${cap(c.name)}`,
    param: c.name,
    voName: c.voName,
    voFileName: c.voName.replace(/([A-Z])/g, (m, c1, o) => (o ? '-' : '') + c1.toLowerCase()),
    // el import del mock debe apuntar a donde vive el VO: módulo (vo) o shared del contexto (voShared)
    shared: Boolean(c.field.voShared),
    givenName: `givenBy${cap(c.name)}`
  }))

  // withX canónicos: id + únicos + relaciones + enums de dominio (vo con values)
  const withFields = ctxs.filter(
    c =>
      c.unique ||
      (c.field.relation && c.field.type === 'uuid') ||
      (typeof c.field.vo === 'object' && c.field.vo.values?.length)
  )

  const srcBase = `../../../../../src/contexts`
  const moduleBase = `${srcBase}/${definition.context}/modules/${definition.plural}`
  const contextShared = `${srcBase}/${definition.context}/shared/domain/value-objects`
  const globalShared = `${srcBase}/shared/domain/value-objects`

  return {
    emit: true,
    uniqueFinders,
    portImports: renderPortImports(definition, uniques),
    builderImports: renderBuilderImports(definition, ctxs, moduleBase, contextShared, globalShared),
    builderDefaultLines: ctxs.map(c => `${c.name}: ${builderDefault(definition, c)}`),
    builderWiths: withFields.map(c => ({ cap: cap(c.name), name: c.name, tsType: builderWithType(c) })),
    builderCreateArgs: [
      `id: ${className}Id.create(this.props.id)`,
      ...ctxs.filter(c => !c.sync && !periodFields.includes(c.name)).map(c => `${c.name}: ${createArg(c)}`),
      ...(period
        ? [
            `period: Period.create(\n        this.props.${period.start} ? ContractDate.create(new Date(this.props.${period.start})) : null,\n        this.props.${period.end} ? ContractDate.create(new Date(this.props.${period.end})) : null\n      )`
          ]
        : [])
    ],
    randomHelpers: uniques
      .filter(c => c.field.type === 'string')
      .map(c => {
        // el valor aleatorio debe respetar el MIN del VO: 10 dígitos por defecto,
        // más si la constraint exige una longitud mínima mayor
        const vo = typeof c.field.vo === 'object' ? c.field.vo : undefined
        const constraintKey = vo?.constraintKey ?? c.name.replace(/([A-Z])/g, '_$1').toUpperCase()
        const min = vo?.minLength === true ? constraintMin(definition, constraintKey) : 0
        const digits = Math.max(10, min)
        const lower = `1${'0'.repeat(digits - 1)}`
        const span = `9${'0'.repeat(digits - 1)}`
        return `const random${cap(c.name)} = (): string => String(Math.floor(${lower} + Math.random() * ${span}))`
      }),
    motherUniqueShortcuts: uniques.map(c => ({ cap: cap(c.name), name: c.name })),
    voTests: renderVoTests(definition, ctxs)
  }
}

function renderVoTests(definition: ResourceDefinition, ctxs: Ctx[]): DomainTestBindings['voTests'] {
  const owned = ctxs.filter(c => typeof c.field.vo === 'object')
  const voOf = (c: Ctx) => c.field.vo as Exclude<FieldDefinition['vo'], string | undefined>
  const key = (c: Ctx) => voOf(c).constraintKey ?? c.name.replace(/([A-Z])/g, '_$1').toUpperCase()

  return {
    enums: owned
      .filter(c => voOf(c).values?.length)
      .map(c => ({ voName: c.voName, valuesList: (voOf(c).values ?? []).map(v => `'${v}'`).join(', ') })),
    numbers: owned
      .filter(c => (c.field.type === 'number' || c.field.type === 'integer') && voOf(c).min)
      .map(c => ({
        voName: c.voName,
        integer: c.field.type === 'integer',
        unset: voOf(c).unset === true,
        minKey: key(c)
      })),
    texts: owned
      .filter(c => c.field.type === 'string' && voOf(c).lengthRule === 'max' && !voOf(c).values?.length)
      .map(c => {
        const vo = voOf(c)
        return {
          voName: c.voName,
          maxKey: key(c),
          // el test de longitud mínima solo existe si el VO la valida
          minKey: vo.minLength === true ? key(c) : null,
          required: vo.ensure === 'string' || vo.minLength === true,
          noInner: vo.noInnerWhitespace === true,
          email: vo.email === true
        }
      }),
    exacts: owned.filter(c => voOf(c).lengthRule === 'exact').map(c => ({ voName: c.voName, lengthKey: key(c) })),
    arrays: owned.filter(c => c.field.column?.array).map(c => ({ voName: c.voName })),
    booleans: owned.filter(c => c.field.type === 'boolean').map(c => ({ voName: c.voName })),
    // los VOs de email quedan fuera: su regex rechaza el texto libre que usa este grupo
    sanitizations: owned
      .filter(c => c.field.type === 'string' && !voOf(c).values?.length && voOf(c).email !== true)
      .map(c => ({ voName: c.voName, inner: voOf(c).noInnerWhitespace === true, minKey: voOf(c).minLength === true ? key(c) : null }))
  }
}

/** MIN declarado en las constraints del recurso para una clave (0 si no existe). */
function constraintMin(definition: ResourceDefinition, constraintKey: string): number {
  const entry = constraintKey.split('.').reduce<unknown>((acc, part) => {
    return acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined
  }, definition.constraints)
  const min = entry && typeof entry === 'object' ? (entry as Record<string, unknown>)['MIN'] : undefined
  return typeof min === 'number' ? min : 0
}

function voName(field: FieldDefinition): string {
  if (typeof field.vo === 'object') return field.vo.name
  if (typeof field.vo === 'string') return field.vo
  if (field.voRef) return field.voRef.name
  if (field.voShared) return field.voShared.name
  if (field.relation && field.type === 'uuid') return `${names(field.relation.to).className}Id`
  return ''
}

function builderDefault(definition: ResourceDefinition, c: Ctx): string {
  if (c.unique && c.field.type === 'string') return `random${cap(c.name)}()`
  if (c.field.type === 'uuid') return 'uuidv7()'
  if (c.sync && (c.nullable || c.field.voShared)) {
    const d = c.field.column?.default
    return d !== undefined ? `'${d}'` : 'null'
  }
  if (c.maint && c.nullable) return 'null'
  const d = c.field.column?.default
  if (c.field.column?.array) return "['Sample Area']"
  if (d !== undefined) return typeof d === 'string' ? `'${d}'` : String(d)
  const vo = typeof c.field.vo === 'object' ? c.field.vo : undefined
  // un enum sin default de columna debe muestrear un valor DEL conjunto, no un literal inventado
  if (vo?.values?.length) return `'${vo.values[0]}'`
  if (c.field.type === 'date') return c.name.toLowerCase().includes('end') ? "'2027-01-14'" : "'2026-01-15'"
  if (c.field.type === 'boolean') return 'false'
  if (c.field.type === 'number' || c.field.type === 'integer') {
    // y un numérico con MIN declarado debe arrancar en el MIN, no en 0
    const min = vo?.min === true ? constraintMin(definition, vo?.constraintKey ?? c.name.replace(/([A-Z])/g, '_$1').toUpperCase()) : 0
    return String(min)
  }
  if (c.nullable) return 'null'
  return `'${names(c.name).className} 1'`
}

function builderWithType(c: Ctx): string {
  if (c.field.type === 'boolean') return 'boolean'
  if (c.field.type === 'number' || c.field.type === 'integer') return 'number'
  return 'string'
}

function createArg(c: Ctx): string {
  const isDate = c.field.voShared?.name === 'ContractDate'
  if (!c.voName) return `this.props.${c.name}`
  if (c.nullable && !isDate && !c.maint) {
    return `this.props.${c.name} === null ? null : ${c.voName}.create(this.props.${c.name})`
  }
  if (c.maint && isDate) {
    return `this.props.${c.name} ? ContractDate.create(new Date(this.props.${c.name})) : ContractDate.unset()`
  }
  if (c.maint && c.nullable) {
    return `this.props.${c.name} != null ? ${c.voName}.create(this.props.${c.name}) : ${c.voName}.unset()`
  }
  if (c.maint) return `${c.voName}.create(this.props.${c.name} ?? '')`
  return `${c.voName}.create(this.props.${c.name})`
}

function renderPortImports(definition: ResourceDefinition, uniques: Ctx[]): string[] {
  const n = names(definition.name)
  const lines = [
    `import { Nullable } from '../../../../shared/domain/types'`,
    `import { Criteria } from '../../../../shared/domain/query/criteria'`,
    `import { ${n.className}Id } from '../../../../shared/domain/value-objects/${definition.plural}/${n.fileName}-id.vo'`
  ]
  for (const c of uniques) {
    if (c.field.voShared) {
      lines.push(`import { ${c.voName} } from '../../../shared/domain/value-objects/${names(c.voName).fileName}.vo'`)
    } else {
      lines.push(`import { ${c.voName} } from './value-objects/${names(c.voName).fileName}.vo'`)
    }
  }
  lines.push(`import { ${n.className} } from './${n.fileName}'`)
  return lines
}

function renderBuilderImports(
  definition: ResourceDefinition,
  ctxs: Ctx[],
  moduleBase: string,
  contextShared: string,
  globalShared: string
): string[] {
  const n = names(definition.name)
  const period = definition.period
  const periodFields = period ? [period.start, period.end] : []
  const used = ctxs.filter(c => !c.sync && !periodFields.includes(c.name) && c.voName)

  const lines = [
    `import { v7 as uuidv7 } from 'uuid'`,
    `import { ${n.className} } from '${moduleBase}/domain/${n.fileName}'`,
    `import { ${n.className}PrimitiveProps } from '${moduleBase}/domain/${n.fileName}-types'`
  ]
  const locals = new Set<string>()
  const shareds = new Set<string>()
  for (const c of used) {
    if (typeof c.field.vo === 'object' || c.field.voRef) locals.add(c.voName)
    else if (c.field.voShared) shareds.add(c.voName)
  }
  if (period) {
    shareds.add('Period')
    shareds.add('ContractDate')
  }
  for (const vo of [...locals].sort()) {
    lines.push(`import { ${vo} } from '${moduleBase}/domain/value-objects/${names(vo).fileName}.vo'`)
  }
  for (const vo of [...shareds].sort()) {
    lines.push(`import { ${vo} } from '${contextShared}/${names(vo).fileName}.vo'`)
  }
  lines.push(`import { ${n.className}Id } from '${globalShared}/${definition.plural}/${n.fileName}-id.vo'`)
  for (const c of ctxs.filter(x => x.field.relation && x.field.type === 'uuid')) {
    const rel = names(c.field.relation?.to ?? '')
    lines.push(`import { ${rel.className}Id } from '${globalShared}/${c.field.relation?.to}s/${rel.fileName}-id.vo'`)
  }
  return lines
}
