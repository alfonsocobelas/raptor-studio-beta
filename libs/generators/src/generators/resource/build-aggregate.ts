import { names } from '@nx/devkit'
import { FieldDefinition, ResourceDefinition, VoDefinition } from '@acc/schema'
import { CompositionBindings, renderComposition } from './build-composition'

/**
 * Canonical aggregate synthesis (C2 decision, like the list): protocol
 * create/register/fromPrimitives/toPrimitives/updateDetails/equals + 1:1 VO fields +
 * Period composition + falsy-safe guards + newXIfChanged uniqueness. Sync BEHAVIOR
 * (claimBySync/markSeen/archive, custom consistency checks) stays out: hand edits.
 * All rendering here on purpose — the two templates only interpolate (rule #8).
 */
export interface AggregateBindings {
  emitAggregate: boolean
  aggImports: string[]
  typesImports: string[]
  ctorParams: string[]
  getterBlocks: string[]
  createArgs: string[]
  registerArgs: string[]
  fromPrimitivesArgs: string[]
  toPrimitivesLines: string[]
  updateGuardBlocks: string[]
  uniquenessMethods: string[]
  aggregatePropsLines: string[]
  primitivePropsLines: string[]
  updateOmitKeys: string[]
  uniquenessPickKeys: string[]
  registerPropsLines: string[]
  aggregateTypeNames: string[]
  composition: CompositionBindings | null
}

interface FieldCtx {
  name: string
  field: FieldDefinition
  voName: string
  nullable: boolean
  sync: boolean
  maint: boolean
  unique: boolean
  isArray: boolean
  unset: boolean
}

export function renderAggregate(definition: ResourceDefinition): AggregateBindings {
  const n = names(definition.name)
  const className = n.className
  const idClass = `${className}Id`
  const period = definition.period

  const all = Object.entries(definition.fields).filter(([name]) => name !== 'id')
  const ctxs: FieldCtx[] = all.map(([name, field]) => ({
    name,
    field,
    voName: voNameOf(field),
    nullable: field.nullable ?? false,
    sync: field.syncManaged ?? false,
    maint: (field.optionalPrimitive ?? false) && !(field.syncManaged ?? false),
    unique: field.unique ?? false,
    isArray: field.column?.array ?? false,
    unset:
      (typeof field.vo === 'object' && field.vo.unset === true) ||
      field.voShared?.unset === true ||
      field.voRef?.unset === true
  }))

  // síntesis solo cuando el modelo declara VOs propios (forma objeto): sin ellos no hay dominio emitible
  if (!ctxs.some(c => typeof c.field.vo === 'object')) {
    return emptyBindings()
  }

  // El par de fechas del period se pliega en un solo miembro `period`
  const periodFields = period ? [period.start, period.end] : []
  const members = ctxs.filter(c => !periodFields.includes(c.name))
  const editable = ctxs.filter(c => !c.sync && (!c.maint || c.field.updatable) && !periodFields.includes(c.name))

  const sharedVoNames = new Set<string>()
  for (const c of ctxs) if (c.field.voShared) sharedVoNames.add(c.field.voShared.name)
  if (period) sharedVoNames.add('Period')

  const localVoNames = [
    ...new Set(ctxs.filter(c => typeof c.field.vo === 'object' || c.field.voRef).map(c => c.voName))
  ]

  const aggregateTypeNames = [
    `${className}AggregateProps`,
    `${className}PrimitiveProps`,
    `${className}UniquenessUpdateProps`,
    `${className}UpdateProps`,
    `Register${className}Props`
  ].sort()

  const composition = renderComposition(definition, className)

  const bindings: AggregateBindings = {
    emitAggregate: true,
    aggImports: renderAggImports(definition, idClass, sharedVoNames, localVoNames, ctxs, composition),
    typesImports: renderTypesImports(definition, idClass, sharedVoNames, localVoNames, ctxs, composition),
    ctorParams: [
      `private readonly _id: ${idClass}`,
      ...members.map(c => `private _${c.name}: ${memberType(c)}`),
      ...(period ? ['private _period: Period'] : [])
    ],
    getterBlocks: [
      `  get id(): ${idClass} {\n    return this._id\n  }`,
      ...members.map(c => `  get ${c.name}(): ${memberType(c)} {\n    return this._${c.name}\n  }`),
      ...(period ? ['  get period(): Period {\n    return this._period\n  }'] : [])
    ],
    createArgs: [
      'props.id',
      ...members.map(c => (c.sync ? syncCreateDefault(c) : `props.${c.name}`)),
      ...(period ? ['props.period'] : [])
    ],
    registerArgs: [
      `id: ${idClass}.create(props.id)`,
      ...members
        .filter(c => !c.sync)
        .map(c => `${c.name}: ${isUnknownAtRegister(c) ? unknownAtRegisterValue(c) : registerArg(c)}`),
      ...(period ? [`period: ${periodCreate(period, 'props')}`] : [])
    ],
    fromPrimitivesArgs: [
      `${idClass}.create(props.id)`,
      ...members.map(c => fromPrimitivesArg(c)),
      ...(period ? [periodCreate(period, 'props')] : [])
    ],
    toPrimitivesLines: [
      'id: this._id.value',
      ...ctxs.map(c => toPrimitivesLine(c, period)).filter((l): l is string => l !== null)
    ],
    updateGuardBlocks: [...editable.map(c => updateGuard(c)), ...(period ? [periodUpdateGuard(period)] : [])],
    uniquenessMethods: [
      // canon customer.ts: los has<Cap>() de los uniques opcionales van antes de los new*IfChanged
      ...ctxs.filter(c => isOptionalUnique(c)).map(c => presenceMethod(c)),
      ...ctxs.filter(c => c.unique).map(c => uniquenessMethod(c, className))
    ],
    aggregatePropsLines: [
      `id: ${idClass}`,
      ...members.filter(c => !c.sync).map(c => `${c.name}: ${memberType(c)}`),
      ...(period ? ['period: Period'] : [])
    ],
    primitivePropsLines: ['id: string', ...ctxs.map(c => primitiveLine(c))],
    updateOmitKeys: ['id', ...ctxs.filter(c => c.sync || (c.maint && !c.field.updatable)).map(c => c.name)],
    uniquenessPickKeys: ctxs.filter(c => c.unique).map(c => c.name),
    registerPropsLines: [
      'id: string',
      ...ctxs
        .filter(c => !c.sync && !isUnknownAtRegister(c))
        .map(c =>
          c.field.required
            ? `${c.name}: ${c.nullable ? `Nullable<${primitiveType(c)}>` : primitiveType(c)}`
            : `${c.name}?: ${c.nullable ? `${primitiveType(c)} | null` : primitiveType(c)}`
        )
    ],
    aggregateTypeNames,
    composition
  }

  if (composition) {
    // el hijo se inserta justo antes del primer miembro sync (canon customer.ts); +1 por el slot del id
    const firstSync = members.findIndex(c => c.sync)
    const at = firstSync === -1 ? members.length + 1 : firstSync + 1
    bindings.ctorParams.splice(at, 0, composition.parentCtorParam)
    bindings.getterBlocks.splice(at, 0, composition.parentGetter)
    bindings.createArgs.splice(at, 0, composition.parentCreateArg)
    bindings.fromPrimitivesArgs.splice(at, 0, composition.parentFromPrimitivesArg)
  }

  return bindings
}

function emptyBindings(): AggregateBindings {
  return {
    emitAggregate: false,
    composition: null,
    aggImports: [],
    typesImports: [],
    ctorParams: [],
    getterBlocks: [],
    createArgs: [],
    registerArgs: [],
    fromPrimitivesArgs: [],
    toPrimitivesLines: [],
    updateGuardBlocks: [],
    uniquenessMethods: [],
    aggregatePropsLines: [],
    primitivePropsLines: [],
    updateOmitKeys: [],
    uniquenessPickKeys: [],
    registerPropsLines: [],
    aggregateTypeNames: []
  }
}

function voNameOf(field: FieldDefinition): string {
  if (typeof field.vo === 'object') return field.vo.name
  if (typeof field.vo === 'string') return field.vo
  if (field.voRef) return field.voRef.name
  if (field.voShared) return field.voShared.name
  if (field.relation && field.type === 'uuid') return `${names(field.relation.to).className}Id`
  return ''
}

function memberType(c: FieldCtx): string {
  if (!c.voName) return c.nullable ? `Nullable<${primitiveType(c)}>` : primitiveType(c)
  return c.nullable ? `Nullable<${c.voName}>` : c.voName
}

function primitiveType(c: FieldCtx): string {
  if (c.isArray) return 'string[]'
  switch (c.field.type) {
    case 'boolean':
      return 'boolean'
    case 'number':
    case 'integer':
      return 'number'
    default:
      return 'string'
  }
}

function isDateShared(c: FieldCtx): boolean {
  return c.field.voShared?.name === 'ContractDate'
}

function isTimestamp(c: FieldCtx): boolean {
  return c.field.voShared?.name === 'SyncTimestamp'
}

function defaultLiteral(c: FieldCtx): string {
  const d = c.field.column?.default
  if (c.isArray) return '[]'
  if (d === undefined) return emptyForType(c)
  return typeof d === 'string' ? `'${d}'` : String(d)
}

/** El «vacío» de cada tipo. Sin esto un entero recibía `''` y el agregado emitido no compilaba. */
function emptyForType(c: FieldCtx): string {
  if (c.field.type === 'boolean') return 'false'
  if (c.field.type === 'number' || c.field.type === 'integer') return '0'
  return "''"
}

function syncCreateDefault(c: FieldCtx): string {
  if (isTimestamp(c)) return 'null'
  return `${c.voName}.create(${defaultLiteral(c)})`
}

/**
 * ¿Es un campo que el ALTA no conoce? El canon inicializa así los campos que rellena después el
 * sync (`docs/referencia/.../project.ts:116`: `atRisk: null`, `waveStage: null`…) en vez de
 * pedirlos al llamante. Lo declara el modelo: medido contra el canon, NINGUNA combinación de
 * banderas lo distingue — `project.waveStage` y `contract.upcomingMaintenanceEnd` son idénticas y
 * el canon trata una como desconocida y la otra como dato del alta.
 */
function isUnknownAtRegister(c: FieldCtx): boolean {
  return c.field.omitAtRegister === true
}

/**
 * Cómo se escribe «sin valor» en el alta: con el `unset()` del VO si lo tiene, y `null` si no.
 * Es literalmente lo que hace el canon: `planToGoLive: ContractDate.unset()` (el VO compartido
 * declara unset) frente a `sapProjectId: null` (su VO no lo declara).
 */
function unknownAtRegisterValue(c: FieldCtx): string {
  return c.voName && hasUnset(c) ? `${c.voName}.unset()` : 'null'
}

/** Un VO expone `unset()` cuando algún campo que lo usa declara que puede quedar sin valor. */
function hasUnset(c: FieldCtx): boolean {
  return c.unset || isDateShared(c)
}

function registerArg(c: FieldCtx): string {
  // los campos sin VO reciben el mismo relleno que en `fromPrimitives`: si el alta no los exige,
  // su prop es opcional y el agregado los pide siempre. Canon: `.../license.builder.ts:91`.
  if (!c.voName) {
    if (c.field.required) return `props.${c.name}`
    return `props.${c.name} ?? ${c.nullable ? 'null' : defaultLiteral(c)}`
  }
  if (c.nullable && !isDateShared(c)) {
    return `props.${c.name} === null ? null : ${c.voName}.create(props.${c.name})`
  }
  if (isDateShared(c) && c.unset) {
    return `props.${c.name} ? ContractDate.create(new Date(props.${c.name})) : ContractDate.unset()`
  }
  // `unset` describe la clase del VO; que el campo pueda quedar sin valor lo dice `nullable`
  if (c.unset && c.nullable) {
    return `props.${c.name} != null ? ${c.voName}.create(props.${c.name}) : ${c.voName}.unset()`
  }
  if (c.field.required) return `${c.voName}.create(props.${c.name})`
  return `${c.voName}.create(props.${c.name} ?? ${defaultLiteral(c)})`
}

function fromPrimitivesArg(c: FieldCtx): string {
  if (!c.voName) return c.maint ? `props.${c.name} ?? ${c.nullable ? 'null' : defaultLiteral(c)}` : `props.${c.name}`
  if (c.sync && isTimestamp(c)) {
    return `props.${c.name} ? SyncTimestamp.fromISOString(props.${c.name}) : null`
  }
  if (c.sync) return `props.${c.name} ? ${c.voName}.create(props.${c.name}) : ${c.voName}.create(${defaultLiteral(c)})`
  if (c.maint && isDateShared(c)) {
    return `props.${c.name} ? ContractDate.create(new Date(props.${c.name})) : ContractDate.${c.unset ? 'unset()' : 'unset()'}`
  }
  if (c.maint && c.unset) {
    return `props.${c.name} != null ? ${c.voName}.create(props.${c.name}) : ${c.voName}.unset()`
  }
  if (c.maint && c.nullable) return `props.${c.name} ? ${c.voName}.create(props.${c.name}) : null`
  if (c.maint) return `${c.voName}.create(props.${c.name} ?? ${defaultLiteral(c)})`
  if (c.nullable) return `props.${c.name} === null ? null : ${c.voName}.create(props.${c.name})`
  return `${c.voName}.create(props.${c.name})`
}

function periodCreate(period: { start: string; end: string }, source: string): string {
  return `Period.create(\n      ${source}.${period.start} ? ContractDate.create(new Date(${source}.${period.start})) : null,\n      ${source}.${period.end} ? ContractDate.create(new Date(${source}.${period.end})) : null\n    )`
}

function toPrimitivesLine(c: FieldCtx, period?: { start: string; end: string }): string | null {
  if (period && c.name === period.start) {
    return `${c.name}: this._period.start ? this._period.start.toDateString() : null`
  }
  if (period && c.name === period.end) {
    return `${c.name}: this._period.end ? this._period.end.toDateString() : null`
  }
  if (!c.voName) return `${c.name}: this._${c.name}`
  if (isTimestamp(c)) return `${c.name}: this._${c.name}?.toISOString() ?? null`
  if (isDateShared(c)) return `${c.name}: this._${c.name} ? this._${c.name}.toDateString() : null`
  if (c.isArray) return `${c.name}: [...this._${c.name}.value]`
  if (c.nullable) return `${c.name}: this._${c.name} ? this._${c.name}.value : null`
  return `${c.name}: this._${c.name}.value`
}

function updateGuard(c: FieldCtx): string {
  // campos sin VO (snapshots numéricos): asignación cruda, como en toPrimitives
  const assign = !c.voName
    ? `this._${c.name} = updates.${c.name}`
    : c.nullable
      ? `this._${c.name} = updates.${c.name} === null ? null : ${c.voName}.create(updates.${c.name})`
      : `this._${c.name} = ${c.voName}.create(updates.${c.name})`
  return `    if (updates.${c.name} !== undefined) {\n      ${assign}\n    }`
}

function periodUpdateGuard(period: { start: string; end: string }): string {
  const { start, end } = period
  return [
    `    if (updates.${start} !== undefined || updates.${end} !== undefined) {`,
    `      const start =`,
    `        updates.${start} !== undefined`,
    `          ? updates.${start}`,
    `            ? ContractDate.create(new Date(updates.${start}))`,
    `            : null`,
    `          : this._period.start`,
    `      const end =`,
    `        updates.${end} !== undefined`,
    `          ? updates.${end}`,
    `            ? ContractDate.create(new Date(updates.${end}))`,
    `            : null`,
    `          : this._period.end`,
    `      this._period = Period.create(start, end)`,
    `    }`
  ].join('\n')
}

/** Unique opcional (semántica ifPresent): string no requerido y no nullable, como el taxId del canon. */
function isOptionalUnique(c: FieldCtx): boolean {
  return c.unique && c.field.required !== true && !c.nullable && c.field.type === 'string'
}

function presenceMethod(c: FieldCtx): string {
  const cap = c.name.charAt(0).toUpperCase() + c.name.slice(1)
  return [`  has${cap}(): boolean {`, `    return !this._${c.name}.isEmpty()`, `  }`].join('\n')
}

function uniquenessMethod(c: FieldCtx, className: string): string {
  const cap = c.name.charAt(0).toUpperCase() + c.name.slice(1)
  return [
    `  new${cap}IfChanged(updates: ${className}UniquenessUpdateProps): Undefinable<${c.voName}> {`,
    `    if (!updates.${c.name}) {`,
    `      return`,
    `    }`,
    ``,
    `    const new${cap} = ${c.voName}.create(updates.${c.name})`,
    ``,
    `    if (this._${c.name}${c.nullable ? '?' : ''}.equals(new${cap})) {`,
    `      return`,
    `    }`,
    ``,
    `    return new${cap}`,
    `  }`
  ].join('\n')
}

function primitiveLine(c: FieldCtx): string {
  const optional = c.sync || c.maint ? '?' : ''
  const base = primitiveType(c)
  const t = c.nullable ? `Nullable<${base}>` : base
  return `${c.name}${optional}: ${t}`
}

function renderAggImports(
  definition: ResourceDefinition,
  idClass: string,
  sharedVoNames: Set<string>,
  localVoNames: string[],
  ctxs: FieldCtx[],
  composition: CompositionBindings | null
): string[] {
  const n = names(definition.name)
  const hasUnique = ctxs.some(c => c.unique)
  const lines = [
    `import { AggregateRoot } from '../../../../shared/domain/aggregate-root'`,
    `import { Nullable${hasUnique ? ', Undefinable' : ''} } from '../../../../shared/domain/types'`,
    `import { ${idClass} } from '../../../../shared/domain/value-objects/${definition.plural}/${n.fileName}-id.vo'`
  ]
  const otherIds = ctxs.filter(c => c.field.relation && c.field.type === 'uuid')
  for (const c of otherIds) {
    const rel = names(c.field.relation?.to ?? '')
    lines.push(
      `import { ${rel.className}Id } from '../../../../shared/domain/value-objects/${c.field.relation?.to}s/${rel.fileName}-id.vo'`
    )
  }
  for (const shared of [...sharedVoNames].sort()) {
    lines.push(`import { ${shared} } from '../../../shared/domain/value-objects/${names(shared).fileName}.vo'`)
  }
  const typeNames = [
    `${n.className}AggregateProps`,
    `${n.className}PrimitiveProps`,
    ...(hasUnique ? [`${n.className}UniquenessUpdateProps`] : []),
    `${n.className}UpdateProps`,
    `Register${n.className}Props`,
    ...(composition?.parentExtraTypeNames ?? [])
  ].sort()
  lines.push(`import {\n  ${typeNames.join(',\n  ')}\n} from './${n.fileName}-types'`)
  for (const vo of [...localVoNames].sort()) {
    lines.push(`import { ${vo} } from './value-objects/${names(vo).fileName}.vo'`)
  }
  if (composition) {
    lines.push(...composition.parentExtraImports)
  }
  return lines
}

function renderTypesImports(
  definition: ResourceDefinition,
  idClass: string,
  sharedVoNames: Set<string>,
  localVoNames: string[],
  ctxs: FieldCtx[],
  composition: CompositionBindings | null
): string[] {
  const n = names(definition.name)
  const period = definition.period
  const periodFields = period ? [period.start, period.end] : []
  // solo los VOs que AggregateProps referencia (miembros no-sync)
  const used = new Set(ctxs.filter(c => !c.sync && !periodFields.includes(c.name) && c.voName).map(c => c.voName))
  if (period) used.add('Period')

  const lines = [
    `import { Nullable } from '../../../../shared/domain/types'`,
    `import { ${idClass} } from '../../../../shared/domain/value-objects/${definition.plural}/${n.fileName}-id.vo'`
  ]
  const otherIds = ctxs.filter(c => c.field.relation && c.field.type === 'uuid')
  for (const c of otherIds) {
    const rel = names(c.field.relation?.to ?? '')
    lines.push(
      `import { ${rel.className}Id } from '../../../../shared/domain/value-objects/${c.field.relation?.to}s/${rel.fileName}-id.vo'`
    )
  }
  for (const shared of [...sharedVoNames].sort()) {
    if (used.has(shared)) {
      lines.push(`import { ${shared} } from '../../../shared/domain/value-objects/${names(shared).fileName}.vo'`)
    }
  }
  for (const vo of [...localVoNames].sort()) {
    if (used.has(vo)) {
      lines.push(`import { ${vo} } from './value-objects/${names(vo).fileName}.vo'`)
    }
  }
  if (composition) {
    lines.push(...composition.typesExtraImports.filter(l => !lines.includes(l)))
  }
  return lines
}
