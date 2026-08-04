import { names } from '@nx/devkit'
import { FieldDefinition, ResourceDefinition, VoDefinition } from '@acc/schema'

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

export interface EntrypointBindings {
  emit: boolean
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

  const dtoCtxs: Ctx[] = Object.entries(definition.fields)
    .filter(([name, f]) => name !== 'id' && !f.syncManaged && !(f.optionalPrimitive && !f.updatable))
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
  ops.push(['Export', pluralClass])
  const childOps = comp ? ['Add', 'Update', 'Remove'].map(op => `${op}${names(comp.name).className}`) : []

  const moduleHandlerImports = [
    ...ops.map(
      ([op, t]) => `import { ${op}${t}Handler } from './application/handlers/${names(op + t).fileName}.handler'`
    ),
    ...childOps.map(c => `import { ${c}Handler } from './application/handlers/${names(c).fileName}.handler'`)
  ]
  const moduleUseCaseImports = [
    ...ops.map(
      ([op, t]) =>
        `import { ${op}${t}UseCase } from './application/use-cases/${names(op + t).fileName}-usecase.service'`
    ),
    ...childOps.map(c => `import { ${c}UseCase } from './application/use-cases/${names(c).fileName}-usecase.service'`)
  ]
  const moduleProviderNames = [
    ...ops.map(([op, t]) => `${op}${t}Handler`),
    ...childOps.map(c => `${c}Handler`),
    ...ops.map(([op, t]) => `${op}${t}UseCase`),
    ...childOps.map(c => `${c}UseCase`)
  ]

  return {
    emit: emitAggregate,
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

    if (c.field.relation && c.field.type === 'uuid') {
      lines.push(`${c.name}: '${seedUuid(`${c.field.relation.to}s`, i)}'`)
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
    else if (vo?.noInnerWhitespace) lines.push(`${c.name}: 'SEED-${names(definition.name).constantName}-${i}'`)
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
