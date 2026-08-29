import { names } from '@nx/devkit'
import { MODELS } from './models/registry'
import { SHARED_VOS } from './models/shared-vos'
import { denormTargets } from './denormalization'
import {
  AccessRole,
  FieldDefinition,
  ResourceDefinition,
  resolveAccess,
  StateTransition,
  VoDefinition
} from '@raptor/schema'

/**
 * Entrypoints synthesis: REST controller, class-validator body DTOs, export
 * columns and NestJS module wiring. Validators derive from the same schema
 * constraints the VOs enforce, so edge and domain never drift apart.
 */
export interface DtoFieldBinding {
  decorators: string[]
  declaration: string
}

export interface ExportColumnBinding {
  line: string
}

export interface TransitionBinding {
  /** Segmento de la ruta (':id/terminate') y slug de los ficheros */
  verb: string
  /** Nombre del método del controller y del agregado */
  method: string
  /** Prefijo de clase compuesto (TerminateContract) */
  className: string
  /** Slug de fichero compuesto (terminate-contract) */
  file: string
  label: string
  /** Expresión de visibilidad del botón en la ficha: from.includes(estado actual) */
  fromCheck: string
  /** Argumentos de @Roles(...) del endpoint, desde la matriz de accesos (spec 46) */
  roles: string
}

export interface EntrypointBindings {
  emit: boolean
  /** Argumentos de @Roles(...) para las lecturas, con admin siempre primero (spec 46) */
  readRoles: string
  /** Argumentos de @Roles(...) para crear: POST e import (spec 49) */
  createRoles: string
  /** Argumentos de @Roles(...) para editar: PUT, composición y escrituras de adjuntos */
  updateRoles: string
  /** Argumentos de @Roles(...) para borrar: DELETE */
  deleteRoles: string
  /** Import de constantes de acceso para la lista (solo con matriz declarada) */
  listAccessImports: string
  /** Import de constantes de acceso para la ficha (solo con matriz declarada) */
  detailAccessImports: string
  /** Expresión de guardia de crear en plantillas compartidas: canCreate() o canWrite() */
  canCreateExpr: string
  /** Expresión de guardia de editar */
  canEditExpr: string
  /** Expresión de guardia de borrar */
  canDeleteExpr: string
  /** El recurso declara matriz: los adjuntos (hoy sin decoradores) los ganan solo entonces */
  accessDeclared: boolean
  /** Las transiciones de la máquina de estados (spec 43) */
  transitions: TransitionBinding[]
  /** Solo las visibles en la ficha (spec 74): la curación `hidden` no toca endpoint ni kanban */
  detailTransitions: TransitionBinding[]
  registerDtoFields: DtoFieldBinding[]
  updateDtoFields: DtoFieldBinding[]
  registerValidatorImports: string[]
  updateValidatorImports: string[]
  dtoVoImports: string[]
  usesLimits: boolean
  labelMaps: { constName: string; entries: string }[]
  exportColumnLines: string[]
  exportFileName: string
  needsLabelHelper: boolean
  childDtoFields: DtoFieldBinding[] | null
  childUpdateDtoFields: DtoFieldBinding[] | null
  childValidatorImports: string[]
  childUpdateValidatorImports: string[]
  childDtoVoImports: string[]
  childUsesLimits: boolean
  /** add-use-case contact literal: lines like `role: input.contact.role ?? ''` */
  childAddLines: string[]
  childControllerClass: string
  childControllerFile: string
  moduleHandlerImports: string[]
  moduleUseCaseImports: string[]
  moduleProviderNames: string[]
  /** filas derivadas del schema para el seed local (2 items; lo realista va al hueco @ai) */
  seedItems: string[][]
  seedConst: string
}

interface Ctx {
  name: string
  field: FieldDefinition
  required: boolean
  nullable: boolean
}

export function renderEntrypoints(definition: ResourceDefinition, emitAggregate: boolean): EntrypointBindings {
  const n = names(definition.name)
  const comp = definition.composition

  // los destinos de denormalización (spec 60) no viajan en escritura: los copia el use case
  const denormalized = denormTargets(definition)
  const dtoCtxs: Ctx[] = Object.entries(definition.fields)
    // el campo promovido a estado (spec 43) ni se pide en el alta ni se edita: solo transiciona
    .filter(
      ([name, f]) =>
        name !== 'id' &&
        name !== definition.state?.field &&
        !f.syncManaged &&
        !(f.optionalPrimitive && !f.updatable) &&
        !denormalized.has(name)
    )
    .map(([name, f]) => ({ name, field: f, required: f.required ?? false, nullable: f.nullable ?? false }))

  const registerDtoFields = [idDtoField('id'), ...dtoCtxs.map(c => dtoField(c, definition, false))]
  const updateDtoFields = dtoCtxs.map(c => dtoField(c, definition, true))

  const childCtxs: Ctx[] = comp
    ? Object.entries(comp.fields)
        .filter(([name]) => name !== 'id' && name !== comp.parentField)
        .map(([name, f]) => ({ name, field: f, required: f.required ?? false, nullable: false }))
    : []
  const childDtoFields = comp ? [idDtoField('id'), ...childCtxs.map(c => dtoField(c, definition, false))] : null
  const childUpdateDtoFields = comp ? childCtxs.map(c => dtoField(c, definition, true)) : null

  const badgeCols = Object.entries(definition.fields).filter(
    ([, f]) => f.table?.show && f.table.badgeMap && !f.syncManaged
  )
  const labelMaps = badgeCols.map(([name, f]) => ({
    constName: `${names(name).constantName}_LABELS`,
    entries: Object.entries(f.table?.badgeMap ?? {})
      .map(([value, meta]) => `${quoteKey(value)}: '${meta.label}'`)
      .join(', ')
  }))

  const exportColumnLines = Object.entries(definition.fields)
    .filter(([, f]) => f.table?.show && !f.syncManaged)
    .sort(([, a], [, b]) => (a.table?.order ?? Number.MAX_SAFE_INTEGER) - (b.table?.order ?? Number.MAX_SAFE_INTEGER))
    .map(([name, f]) => {
      const header = f.table?.label ?? name
      if (f.table?.badgeMap) {
        return `{ key: '${name}', header: '${header}', format: value => label(${names(name).constantName}_LABELS, value) }`
      }
      return `{ key: '${name}', header: '${header}' }`
    })

  const writes = (definition.formSections?.length ?? 0) > 0
  const removes = definition.list?.features?.delete === true
  const pluralClass = names(definition.plural).className
  const ops: [string, string][] = []
  if (writes) ops.push(['Register', n.className])
  ops.push(['Search', pluralClass], ['Get', n.className])
  if (writes) ops.push(['Update', n.className])
  if (removes) ops.push(['Remove', n.className])
  // el historial (spec 31): la timeline de la ficha lee del puerto de auditoría
  if (definition.history === true) ops.push(['Get', `${n.className}History`])
  ops.push(['Export', pluralClass])
  // la agregación (spec 71): un valor del conjunto filtrado. Va en `ops` para que el módulo
  // cablee su handler y su caso de uso como los demás
  ops.push(['Aggregate', pluralClass])
  const childOps = comp ? ['Add', 'Update', 'Remove'].map(op => `${op}${names(comp.name).className}`) : []

  // las transiciones (spec 43) van APARTE de ops: su slug de fichero es el del VERBO
  // ('a-en-analisis-muestra'), no el derivado del PascalCase compuesto ('aen-analisis-…') —
  // un verbo multi-palabra descuadraba el import del módulo con el fichero emitido
  const transitionWires = (definition.state?.transitions ?? []).map(t => ({
    className: `${names(t.name).className}${n.className}`,
    file: `${names(t.name).fileName}-${n.fileName}`
  }))

  const moduleHandlerImports = [
    ...ops.map(
      ([op, t]) => `import { ${op}${t}Handler } from './application/handlers/${names(op + t).fileName}.handler'`
    ),
    ...transitionWires.map(w => `import { ${w.className}Handler } from './application/handlers/${w.file}.handler'`),
    ...childOps.map(c => `import { ${c}Handler } from './application/handlers/${names(c).fileName}.handler'`)
  ]
  const moduleUseCaseImports = [
    ...ops.map(
      ([op, t]) =>
        `import { ${op}${t}UseCase } from './application/use-cases/${names(op + t).fileName}-usecase.service'`
    ),
    ...transitionWires.map(
      w => `import { ${w.className}UseCase } from './application/use-cases/${w.file}-usecase.service'`
    ),
    ...childOps.map(c => `import { ${c}UseCase } from './application/use-cases/${names(c).fileName}-usecase.service'`)
  ]
  const moduleProviderNames = [
    ...ops.map(([op, t]) => `${op}${t}Handler`),
    ...transitionWires.map(w => `${w.className}Handler`),
    ...childOps.map(c => `${c}Handler`),
    ...ops.map(([op, t]) => `${op}${t}UseCase`),
    ...transitionWires.map(w => `${w.className}UseCase`),
    ...childOps.map(c => `${c}UseCase`)
  ]

  const access = resolveAccess(definition)

  const bindTransition = (t: StateTransition): TransitionBinding => ({
    verb: t.name,
    method: names(t.name).propertyName,
    className: `${names(t.name).className}${n.className}`,
    file: `${names(t.name).fileName}-${n.fileName}`,
    label: t.label,
    // la visibilidad del botón ES la máquina: solo se pinta si el from incluye el estado actual
    fromCheck: `[${t.from.map(v => `'${v}'`).join(', ')}].includes(item.${definition.state?.field})`,
    roles: rolesArgs(access.transitions[t.name] ?? ['user'])
  })
  const transitions = (definition.state?.transitions ?? []).map(bindTransition)
  // la curación (spec 74): hidden quita el botón de la ficha y nada más — el resto de
  // consumidores (controller, servicio front, kanban, procesos) leen la lista entera
  const detailTransitions = (definition.state?.transitions ?? []).filter(t => !t.hidden).map(bindTransition)

  // mismos defectos que resolveFeatures (build-substitutions): edit/view abiertos, delete opt-in
  const canEdit = definition.list?.features?.edit ?? true
  const canDelete = definition.list?.features?.delete ?? false
  const accessDeclared = definition.access !== undefined
  const listImports = [
    canEdit ? 'CAN_CREATE_ROLES' : null,
    canDelete ? 'CAN_DELETE_ROLES' : null,
    canEdit ? 'CAN_EDIT_ROLES' : null
  ].filter((name): name is string => name !== null)
  const detailImports = [
    canDelete ? 'CAN_DELETE_ROLES' : null,
    canEdit ? 'CAN_EDIT_ROLES' : null,
    // TRANSITION_ROLES solo si la ficha pinta algún botón (spec 74): con todo hidden, el import sobraría
    detailTransitions.length > 0 ? 'TRANSITION_ROLES' : null
  ].filter((name): name is string => name !== null)

  return {
    emit: emitAggregate,
    readRoles: rolesArgs(access.view),
    createRoles: rolesArgs(access.create),
    updateRoles: rolesArgs(access.edit),
    deleteRoles: rolesArgs(access.delete),
    listAccessImports: listImports.join(', '),
    detailAccessImports: detailImports.join(', '),
    canCreateExpr: accessDeclared ? 'canCreate()' : 'canWrite()',
    canEditExpr: accessDeclared ? 'canEdit()' : 'canWrite()',
    canDeleteExpr: accessDeclared ? 'canDelete()' : 'canWrite()',
    accessDeclared,
    transitions,
    detailTransitions,
    registerDtoFields,
    updateDtoFields,
    registerValidatorImports: collectValidators(registerDtoFields),
    updateValidatorImports: collectValidators(updateDtoFields),
    dtoVoImports: voImports(dtoCtxs, n.fileName),
    usesLimits: usesLimits([...registerDtoFields, ...updateDtoFields]),
    labelMaps,
    exportColumnLines,
    exportFileName: (definition.labels?.plural ?? definition.plural).toLowerCase(),
    needsLabelHelper: labelMaps.length > 0,
    childDtoFields,
    childUpdateDtoFields,
    childValidatorImports: comp ? collectValidators(childDtoFields ?? []) : [],
    childUpdateValidatorImports: comp ? collectValidators(childUpdateDtoFields ?? []) : [],
    childDtoVoImports: comp ? voImports(childCtxs, n.fileName) : [],
    childUsesLimits: comp ? usesLimits([...(childDtoFields ?? []), ...(childUpdateDtoFields ?? [])]) : false,
    childAddLines: comp
      ? [
          'id: input.' + names(comp.name).propertyName + '.id',
          ...childCtxs.map(c => {
            const src = `input.${names(comp.name).propertyName}.${c.name}`
            if (c.required) return `${c.name}: ${src}`
            const fallback = c.field.type === 'boolean' ? 'false' : "''"
            return `${c.name}: ${src} ?? ${fallback}`
          })
        ]
      : [],
    childControllerClass: comp ? `${n.className}${names(comp.plural).className}Controller` : '',
    childControllerFile: comp ? `${n.fileName}-${comp.plural}` : '',
    moduleHandlerImports,
    moduleUseCaseImports,
    moduleProviderNames,
    seedItems: seedRowNumbers(definition).map(i => renderSeedItem(definition, dtoCtxs, i)),
    seedConst: `SEED_${names(definition.plural).constantName}`
  }
}

/** La matriz efectiva a los argumentos del decorador: admin implícito, siempre primero. */
export function rolesArgs(roles: AccessRole[]): string {
  return ['UserRoleEnum.ADMIN', ...roles.map(role => `UserRoleEnum.${role.toUpperCase()}`)].join(', ')
}

/**
 * Un sample del schema al literal que espera el DTO de registro: los booleanos
 * llegan a veces como «Sí/No» (lenguaje del diseño) y las fechas como dd/mm/aaaa.
 */
function renderSampleValue(sample: string | number | boolean, field: FieldDefinition): string {
  if (field.type === 'boolean') {
    const truthy = typeof sample === 'boolean' ? sample : /^(s[ií]|true|1)$/i.test(String(sample).trim())
    return String(truthy)
  }
  if (field.type === 'number' || field.type === 'integer') {
    const value =
      typeof sample === 'number'
        ? sample
        : Number(
            String(sample)
              .replace(',', '.')
              .replace(/[^0-9.-]/g, '')
          )
    return String(Number.isFinite(value) ? value : 0)
  }
  const text = String(sample)
  if (field.type === 'date' || field.type === 'timestamptz') {
    const spanish = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    return `'${spanish ? `${spanish[3]}-${spanish[2]}-${spanish[1]}` : text}'`
  }
  return `'${text.replace(/'/g, "\\'")}'`
}

// UUIDv7-like determinista: categoría estable por recurso (hash del plural) + índice
/** Plural del modelo referenciado: el uuid de semilla del padre se deriva de él. */
function pluralOf(resource: string): string {
  return MODELS[resource]?.plural ?? `${resource}s`
}

function seedUuid(plural: string, n: number): string {
  const category = [...plural].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) % 0xffff, 7)
  return `019eb800-${category.toString(16).padStart(4, '0')}-7000-8000-${n.toString().padStart(12, '0')}`
}

/**
 * MIN declarado para un campo numérico en las constraints del recurso. Sin él las filas
 * derivadas (1, 2) violarían el invariante del VO y el seed abortaría en el primer insert.
 */
function seedMin(
  definition: ResourceDefinition,
  fieldName: string,
  vo?: { constraintKey?: string; min?: boolean }
): number {
  if (!vo?.min) {
    return 0
  }
  const key = vo.constraintKey ?? names(fieldName).constantName
  const entry = key.split('.').reduce<unknown>((acc, part) => {
    return acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[part] : undefined
  }, definition.constraints)
  const min = entry && typeof entry === 'object' ? (entry as Record<string, unknown>)['MIN'] : undefined
  return typeof min === 'number' ? min : 0
}

/** Tope de filas sembradas: es una demo navegable, no una carga de datos. */
const MAX_SEED_ROWS = 10

/**
 * Cuántas filas sembrar: tantas como ejemplos aporte el campo más surtido
 * (los declara quien conoce el negocio, vía el chat del estudio), con un tope.
 * Sin ejemplos se mantienen las dos de siempre.
 */
/** Filas que sembrará otro modelo del registro (para no apuntar más allá). */
function seedRowCount(resource: string): number {
  const parent = MODELS[resource]
  return parent ? seedRowNumbers(parent).length : 2
}

/** Mes N contando desde enero de 2026, desbordando de año si hace falta ('2027-02'). */
function seedMonth(n: number): string {
  const year = 2026 + Math.floor((n - 1) / 12)
  const month = ((n - 1) % 12) + 1
  return `${year}-${String(month).padStart(2, '0')}`
}

function seedRowNumbers(definition: ResourceDefinition): number[] {
  const richest = Math.max(0, ...Object.values(definition.fields).map(field => field.samples?.length ?? 0))
  const rows = Math.min(Math.max(richest, 2), MAX_SEED_ROWS)
  return Array.from({ length: rows }, (_, index) => index + 1)
}

function renderSeedItem(definition: ResourceDefinition, ctxs: Ctx[], i: number): string[] {
  const lines = [`id: '${seedUuid(definition.plural, i)}'`]

  for (const c of ctxs) {
    const vo = typeof c.field.vo === 'object' ? c.field.vo : undefined
    const label = names(c.name).className

    // los campos del period se siembran como intervalos reales y escalonados, aunque el fin
    // sea opcional: sin esto el cronograma (spec 30) nace con barras abiertas y eje de 30 días
    if (definition.period && c.name === definition.period.start) {
      lines.push(`${c.name}: '${seedMonth(i)}-01'`)
      continue
    }
    if (definition.period && c.name === definition.period.end) {
      // seis meses de vigencia; día 28, válido en cualquier mes
      lines.push(`${c.name}: '${seedMonth(i + 6)}-28'`)
      continue
    }

    if (c.field.relation && c.field.type === 'uuid') {
      // El padre puede sembrar menos filas que el hijo: ciclar sobre SUS filas
      // evita apuntar a un id que no existe y violar la clave ajena.
      const parentRows = seedRowCount(c.field.relation.to)
      lines.push(`${c.name}: '${seedUuid(pluralOf(c.field.relation.to), ((i - 1) % parentRows) + 1)}'`)
      continue
    }
    if (vo?.values?.length) {
      lines.push(`${c.name}: '${vo.values[(i - 1) % vo.values.length]}'`)
      continue
    }

    // Ejemplos del dominio: quien conoce el negocio (el chat del estudio) los declara
    // en el schema, así la app nace con datos coherentes en vez de «Nombre seed 1».
    const sample = c.field.samples?.length ? c.field.samples[(i - 1) % c.field.samples.length] : undefined
    if (sample !== undefined) {
      lines.push(`${c.name}: ${renderSampleValue(sample, c.field)}`)
      continue
    }
    if (!c.required) continue

    if (c.field.type === 'boolean') lines.push(`${c.name}: false`)
    else if (c.field.type === 'number' || c.field.type === 'integer')
      lines.push(`${c.name}: ${Math.max(i, seedMin(definition, c.name, vo))}`)
    else if (c.field.type === 'date' || c.field.type === 'timestamptz') lines.push(`${c.name}: '2026-01-0${i}'`)
    // la regla sin-espacios puede venir del VO local O del compartido (canon ContractNumber)
    else if (vo?.noInnerWhitespace || SHARED_VOS[c.field.voShared?.name ?? '']?.noInnerWhitespace)
      lines.push(`${c.name}: 'SEED-${names(definition.name).constantName}-${i}'`)
    else lines.push(`${c.name}: '${label} seed ${i}'`)
  }

  return lines
}

function idDtoField(name: string): DtoFieldBinding {
  return {
    decorators: ['@IsString()', '@IsNotEmpty()', "@IsUUID('7')"],
    declaration: `${name}!: string`
  }
}

function dtoField(c: Ctx, definition: ResourceDefinition, forceOptional: boolean): DtoFieldBinding {
  const optional = forceOptional || !c.required
  const decorators: string[] = []
  if (optional) decorators.push('@IsOptional()')

  const vo = typeof c.field.vo === 'object' ? c.field.vo : undefined
  const limitsKey = vo?.constraintKey ?? names(c.name).constantName

  if (c.field.type === 'uuid') {
    decorators.push('@IsString()')
    if (!optional) decorators.push('@IsNotEmpty()')
    decorators.push("@IsUUID('7')")
    return { decorators, declaration: decl(c.name, optional, 'string', false) }
  }
  if (vo?.values?.length) {
    decorators.push(`@IsIn([...${vo.name}.VALUES])`)
    return { decorators, declaration: decl(c.name, optional, 'string', false) }
  }
  if (c.field.type === 'boolean') {
    decorators.push('@IsBoolean()')
    return { decorators, declaration: decl(c.name, optional, 'boolean', false) }
  }
  if (c.field.type === 'integer' || c.field.type === 'number') {
    decorators.push(c.field.type === 'integer' ? '@IsInt()' : '@IsNumber()')
    if (vo?.min) decorators.push('@Min(0)')
    return { decorators, declaration: decl(c.name, optional, 'number', c.nullable && !c.required) }
  }
  if (c.field.column?.array) {
    decorators.push('@IsArray()', '@IsString({ each: true })')
    return { decorators, declaration: decl(c.name, optional, 'string[]', false) }
  }
  if (c.field.form?.control === 'time') {
    decorators.push('@IsString()')
    if (!optional) decorators.push('@IsNotEmpty()')
    // HH:mm de 24 horas: exactamente lo que emite el input type="time" del navegador
    decorators.push('@Matches(/^([01]\\d|2[0-3]):[0-5]\\d$/)')
    return { decorators, declaration: decl(c.name, optional, 'string', false) }
  }
  if (c.field.type === 'date' || c.field.type === 'timestamptz') {
    const nullableDto = c.nullable && !c.required
    if (nullableDto && optional) decorators.splice(1, 0, '@ValidateIf((_obj, value) => value !== null)')
    decorators.push('@IsString()')
    if (!optional) decorators.push('@IsNotEmpty()')
    return { decorators, declaration: decl(c.name, optional, 'string', nullableDto) }
  }

  if (vo?.email) {
    const emailDecorators = [
      ...(optional ? ['@IsOptional()'] : []),
      "@ValidateIf((_obj, value) => value !== '')",
      '@IsEmail()',
      ...(vo.lengthRule === 'max' && hasConstraint(definition, limitsKey)
        ? [`@MaxLength(LIMITS.${limitsKey}.MAX)`]
        : [])
    ]
    return {
      decorators: [
        '// Vacio permitido (coherente con el dominio); si viene con valor, validar formato.',
        ...emailDecorators
      ],
      declaration: decl(c.name, optional, 'string', false)
    }
  }
  decorators.push('@IsString()')
  if (!optional) decorators.push('@IsNotEmpty()')
  if (c.field.voShared && hasConstraint(definition, limitsKey)) {
    decorators.push(`@MaxLength(LIMITS.${limitsKey}.MAX)`)
  }
  if (vo?.lengthRule === 'exact') {
    decorators.push(`@MaxLength(LIMITS.${limitsKey}.LENGTH)`, `@MinLength(LIMITS.${limitsKey}.LENGTH)`)
  } else {
    if (vo?.minLength) decorators.push(`@MinLength(LIMITS.${limitsKey}.MIN)`)
    if (vo?.lengthRule === 'max' && hasConstraint(definition, limitsKey)) {
      decorators.push(`@MaxLength(LIMITS.${limitsKey}.MAX)`)
    }
  }
  return { decorators, declaration: decl(c.name, optional, 'string', c.nullable && !c.required) }
}

function decl(name: string, optional: boolean, tsType: string, nullable: boolean): string {
  const type = nullable && optional ? `${tsType} | null` : tsType
  return `${name}${optional ? '?' : '!'}: ${type}`
}

function hasConstraint(definition: ResourceDefinition, key: string): boolean {
  // claves anidadas ('CONTACT.NAME') se resuelven paso a paso
  let node: unknown = definition.constraints
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || !(part in node)) return false
    node = (node as Record<string, unknown>)[part]
  }
  return true
}

function collectValidators(fields: DtoFieldBinding[]): string[] {
  const all = new Set<string>()
  for (const f of fields) {
    for (const d of f.decorators) {
      const m = d.match(/^@(\w+)/)
      if (m) all.add(m[1])
    }
  }
  return [...all].sort((a, b) => a.localeCompare(b))
}

function usesLimits(fields: DtoFieldBinding[]): boolean {
  return fields.some(f => f.decorators.some(d => d.includes('LIMITS.')))
}

function voImports(ctxs: Ctx[], _fileName: string): string[] {
  return [
    ...new Set(
      ctxs
        .filter(c => typeof c.field.vo === 'object' && (c.field.vo as VoDefinition).values?.length)
        .map(c => (c.field.vo as VoDefinition).name)
    )
  ]
    .sort()
    .map(vo => `import { ${vo} } from '../../../domain/value-objects/${names(vo).fileName}.vo'`)
}

function quoteKey(value: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) ? value : `'${value}'`
}
