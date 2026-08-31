import { names } from '@nx/devkit'
import { SHARED_VOS } from './models/shared-vos'
import { MODELS } from './models/registry'
import { FieldDefinition, ResourceDefinition } from '@raptor/schema'
import { softDeleteContract } from './drag-tree'

/**
 * Domain test artifacts (spec 14 backend): repository port + object mother + builder +
 * repository mock, synthesized canonically. Sample values derive from column defaults
 * and field types (never hand-transcribed); unique string fields get a random helper.
 */
export interface DomainTestBindings {
  emit: boolean
  uniqueFinders: {
    method: string
    param: string
    voName: string
    voFileName: string
    shared: boolean
    givenName: string
    /** el primitive del campo es Nullable (spec 44): el test emitido cae a '' para compilar */
    nullable: boolean
  }[]
  portImports: string[]
  builderImports: string[]
  builderDefaultLines: string[]
  builderWiths: { cap: string; name: string; tsType: string }[]
  builderCreateArgs: string[]
  randomHelpers: string[]
  motherUniqueShortcuts: { cap: string; name: string }[]
  /**
   * Spec 80: los tests de composición necesitan un hijo VÁLIDO, y sus VOs validan de verdad
   * (longitudes, email, enums). Se construye con el mismo `builderDefault` que da valores al
   * builder del padre, así que respeta constraints y defaults en vez de inventar literales.
   */
  childSampleLines: string[]
  voTests: {
    enums: { voName: string; valuesList: string; comment?: string }[]
    numbers: { voName: string; integer: boolean; unset: boolean; minKey: string }[]
    texts: {
      voName: string
      maxKey: string
      minKey: string | null
      required: boolean
      noInner: boolean
      email: boolean
    }[]
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
  unset: boolean
  /** Campo promovido a estado (spec 43): AggregateProps lo excluye — nace en initial */
  isState: boolean
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Plural del modelo referenciado: dato del registro, no «name + s» (defecto 17). */
function pluralOf(resource: string): string {
  return MODELS[resource]?.plural ?? `${resource}s`
}

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
      unique: field.unique ?? false,
      isState: definition.state?.field === name,
      unset:
        (typeof field.vo === 'object' && field.vo.unset === true) ||
        field.voShared?.unset === true ||
        field.voRef?.unset === true
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
      childSampleLines: [],
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
    givenName: `givenBy${cap(c.name)}`,
    nullable: c.nullable
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
    builderDefaultLines: [...ctxs.map(c => `${c.name}: ${builderDefault(definition, c)}`), 'version: 1'],
    childSampleLines: childCtxs(definition).map(c => `${c.name}: ${childSample(definition, c)}`),
    builderWiths: withFields.map(c => ({ cap: cap(c.name), name: c.name, tsType: builderWithType(c) })),
    builderCreateArgs: [
      `id: ${className}Id.create(this.props.id)`,
      // el campo de estado no viaja a create(): AggregateProps lo excluye (nace en initial)
      ...ctxs
        .filter(c => !c.sync && !c.isState && !periodFields.includes(c.name))
        .map(c => `${c.name}: ${createArg(c)}`),
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
    // fuera del grupo: emails (su regex rechaza el texto libre) y longitudes exactas (el
    // '  Sample text  ' del test no mide lo que el VO exige)
    sanitizations: owned
      .filter(
        c =>
          c.field.type === 'string' &&
          !voOf(c).values?.length &&
          voOf(c).email !== true &&
          voOf(c).lengthRule !== 'exact'
      )
      .map(c => ({
        voName: c.voName,
        inner: voOf(c).noInnerWhitespace === true,
        minKey: voOf(c).minLength === true ? key(c) : null
      }))
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

/**
 * Los campos de la hija de composición, en la misma forma que los del padre, para poder pasarlos
 * por `builderDefault`. El `id` SÍ entra (a diferencia del padre): el input del caso de uso lo
 * lleva explícito, porque la hija no lo genera el repositorio.
 */
function childCtxs(definition: ResourceDefinition): Ctx[] {
  return Object.entries(definition.composition?.fields ?? {}).map(([name, field]) => ({
    name,
    field,
    voName: voName(field),
    nullable: field.nullable ?? false,
    sync: field.syncManaged ?? false,
    maint: (field.optionalPrimitive ?? false) && !(field.syncManaged ?? false),
    unique: field.unique ?? false,
    isState: false,
    unset:
      (typeof field.vo === 'object' && field.vo.unset === true) ||
      field.voShared?.unset === true ||
      field.voRef?.unset === true
  }))
}

/**
 * Valor de muestra de un campo de la hija. Los campos de la hija no declaran columna, así que
 * caerían al literal genérico `'<Campo> 1'` de `builderDefault` — y eso REVIENTA en cuanto el VO
 * tiene formato: ContactEmail valida email y el Phone compartido solo admite dígitos y símbolos.
 * El propio caso de uso emitido ya dice cuál es el valor de un opcional ausente
 * (`input.contact.email ?? ''`), así que el test usa ese mismo y no inventa nada.
 */
function childSample(definition: ResourceDefinition, c: Ctx): string {
  if (!c.field.required && c.field.type === 'string') return "''"
  return builderDefault(definition, c)
}

function builderDefault(definition: ResourceDefinition, c: Ctx): string {
  if (c.unique && c.field.type === 'string') return `random${cap(c.name)}()`
  // el default de un voShared debe SATISFACER su declaración: ahora que la capa compartida se
  // emite, sus guardas corren de verdad y 'ContractNumber 1' (con espacio) tira la suite emitida
  const shared = c.field.voShared ? SHARED_VOS[c.field.voShared.name] : undefined
  if (shared?.kind === 'string' && shared.noInnerWhitespace) {
    return `'${names(c.name).className}-1'`
  }
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
    const min =
      vo?.min === true
        ? constraintMin(definition, vo?.constraintKey ?? c.name.replace(/([A-Z])/g, '_$1').toUpperCase())
        : 0
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
  // el builder SÍ toma estos campos del llamante (a diferencia del alta), así que necesitan
  // fallback: sus props son los primitives, donde son opcionales. Canon:
  // docs/referencia/.../mothers/project.builder.ts:73 → `atRisk: this.props.atRisk ?? null`
  if (!c.voName) {
    if (c.nullable) return `this.props.${c.name} ?? null`
    return c.maint ? `this.props.${c.name} ?? ${emptyForType(c)}` : `this.props.${c.name}`
  }
  // el primitive de una fecha es string: se construye con `new Date(...)` y el vacío es null
  // (o el null con nombre si el VO lo declara). Canon: license.builder.ts:82
  if (isDate) {
    const absent = c.unset || c.maint ? `${c.voName}.unset()` : 'null'
    return `this.props.${c.name} ? ${c.voName}.create(new Date(this.props.${c.name})) : ${absent}`
  }
  if (c.nullable && !c.maint) {
    return `this.props.${c.name} === null ? null : ${c.voName}.create(this.props.${c.name})`
  }
  if (c.maint && c.nullable) {
    // `unset()` sólo en los VOs que lo declaran; el resto, `null` (canon: `sapProjectId: … : null`)
    const absent = c.unset ? `${c.voName}.unset()` : 'null'
    return `this.props.${c.name} != null ? ${c.voName}.create(this.props.${c.name}) : ${absent}`
  }
  if (c.maint) return `${c.voName}.create(this.props.${c.name} ?? ${emptyForType(c)})`
  return `${c.voName}.create(this.props.${c.name})`
}

/** El «vacío» de cada tipo, igual que en el agregado: un entero no se rellena con `''`. */
function emptyForType(c: Ctx): string {
  const d = c.field.column?.default
  if (d !== undefined) return typeof d === 'string' ? `'${d}'` : String(d)
  if (c.field.type === 'boolean') return 'false'
  if (c.field.type === 'number' || c.field.type === 'integer') return '0'
  return "''"
}

function renderPortImports(definition: ResourceDefinition, uniques: Ctx[]): string[] {
  const n = names(definition.name)
  const lines = [
    `import { Nullable } from '../../../../shared/domain/types'`,
    `import { AggregateGroup, AggregateOp, GroupedSpec } from '../../../../shared/domain/query/aggregate'`,
    `import { Criteria } from '../../../../shared/domain/query/criteria'`,
    `import { ${n.className}Id } from '../../../../shared/domain/value-objects/${definition.plural}/${n.fileName}-id.vo'`
  ]
  // El contrato de borrado suave viaja con su operación (spec 38)
  if (softDeleteContract(definition)) {
    lines.splice(
      2,
      0,
      `import { DeleteOperationId } from '../../../../shared/domain/value-objects/delete-operation-id.vo'`
    )
  }
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
    lines.push(
      `import { ${rel.className}Id } from '${globalShared}/${pluralOf(c.field.relation?.to ?? '')}/${rel.fileName}-id.vo'`
    )
  }
  return lines
}
