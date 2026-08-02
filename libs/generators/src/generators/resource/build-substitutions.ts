import { names } from '@nx/devkit'
import { AggregateBindings, renderAggregate } from './build-aggregate'
import { ApplicationBindings, renderApplication } from './build-application'
import { EntrypointBindings, renderEntrypoints } from './build-entrypoints'
import { DomainTestBindings, renderDomainTests } from './build-tests'
import {
  ColumnDefinition,
  ConstraintValue,
  FieldDefinition,
  FieldTable,
  FieldType,
  ResourceDefinition,
  VoDefinition
} from '@acc/schema'

export interface ColumnSubstitution {
  name: string
  tsType: string
  decorator: 'Column' | 'PrimaryColumn'
  /** Pre-rendered decorator arguments, e.g. "'varchar', { length: 20, default: 'active' }" */
  argsSrc: string
  comment: string[]
}

export interface ResourceSubstitutions {
  className: string
  propertyName: string
  fileName: string
  pluralClassName: string
  constantName: string
  plural: string
  context: string
  schemaName: string
  constraintsConst?: string
  audit: boolean
  auditComment: boolean
  softDelete: boolean
  needsNullable: boolean
  needsNumericTransformer: boolean
  needsNullableNumericTransformer: boolean
  /** Pre-rendered typeorm import list, e.g. "Column, Entity, PrimaryColumn" */
  typeormImports: string
  columns: ColumnSubstitution[]
  /** Ordered field-name lists for the search-config (numeric flags first, then booleans in field order) */
  allowedFilters: string[]
  allowedOrders: string[]
  searchableFields: string[]
  /** ALLOWED_FILTERS entries with their optional comment lines */
  filterEntries: { name: string; comment: string[] }[]
  searchNotes: string[]
  ordersNotes: string[]
  /** Pre-rendered lines for <name>-constants.ts, e.g. "CMS_CASE_ID: { MAX: 30 }" */
  constraintEntries: string[]
  /** Pre-rendered extra exported groups, e.g. "OBSERVABILITY_THRESHOLDS: { UNDERUSED_PCT: 40 }" */
  extraConstantBlocks: string[]
  hasSharedConstraints: boolean
  /** Pre-rendered mapper lines */
  toDomainProps: string[]
  toPersistenceLines: string[]
  /** Frontend bindings */
  route: string
  sharedDomainAlias: string
  ui: UiStrings
  /** Pre-rendered ColumnDef entries (badge columns expanded multiline, prettier preserves it) */
  frontendColumns: string[]
  /** Label consts referenced by valueMap columns (imported from ./<fileName>-labels) */
  valueMapImports: string[]
  features: { view: boolean; delete: boolean; edit: boolean }
  /** lucide icons required by the enabled actions */
  icons: string[]
  deleteLabelField: string
  dtoName: string
  api: string
  /** Etiqueta plural legible (para comentarios y títulos emitidos) */
  labelPlural: string
  /** El recurso emite el bloque de adjuntos (spec 14) */
  attachments: boolean
  /** Ficha del registro (spec 16): null cuando el modelo no la declara */
  detail: DetailSubstitution | null
  /** Galería de tarjetas (spec 17): null cuando el modelo no la declara */
  gallery: GallerySubstitution | null
  /** Entidades que REFERENCIAN a esta: sus tablas cuelgan de la ficha (spec 15) */
  related: RelatedSubstitution[]
  /** Segmento del recurso bajo API_PREFIX: el servicio emite `${API_PREFIX}/<apiResource>` */
  apiResource: string
  serviceSharedImports: string
  angularCoreImports: string
  /** Dialog bindings */
  formSections: FormSectionSubstitution[]
  formValueLines: string[]
  formGroupLines: string[]
  formPatchLines: string[]
  dialogSharedImports: string
  needsSelect: boolean
  savedEmitLines: string[]
  formHelperLines: string[]
  lookupInjectLines: string[]
  lookupComputedLines: string[]
  lookupServiceImports: string[]
  labelsModuleImports: string[]
  groupValidatorDefs: string[]
  groupValidatorOption: string
  needsGroupValidatorTypes: boolean
  needsComputed: boolean
  inlineLabelConsts: string[]
  /** Test bindings (service spec + mock, derived from the schema) */
  test: TestBindings
  /** Value objects to emit (fields whose vo is declared in object form) */
  vos: VoSubstitution[]
  aggregate: AggregateBindings
  app: ApplicationBindings
  entry: EntrypointBindings
  domainTests: DomainTestBindings
}

export interface VoSubstitution {
  voClassName: string
  voFileName: string
  kind: 'string' | 'enum' | 'number' | 'integer' | 'boolean' | 'stringArray' | 'uuid'
  fieldName: string
  errorClass: string
  constraintsConst: string
  constraintKey: string
  ensure: 'defined' | 'string'
  noInnerWhitespace: boolean
  minLength: boolean
  email: boolean
  lengthRule?: 'max' | 'exact'
  lengthMessage: string
  min: boolean
  unset: boolean
  valuesUnion: string
  valuesList: string
  valueTypeName: string
}

export interface TestBindings {
  mockConst: string
  sortField: string
  filterSamples: { field: string; label: string; operator: string; value: string }[]
  createSampleLines: string[]
  updateSampleSrc: string
  enumImports: string
  mockItemBlocks: string[]
}

export interface FormFieldSubstitution {
  name: string
  id: string
  label: string
  control: 'text' | 'textarea' | 'select' | 'date' | 'checkbox' | 'number'
  rows?: number
  required: boolean
  options: { value: string; label: string }[]
  optionsType?: string
  default?: string
  placeholder?: string
  labelsConst?: string
  /** Constante de opciones tipadas para <app-select> */
  optionsConst?: string
  groupErrorMessage?: string
  maxLength?: number
  fullWidth?: boolean
  lookup?: { resource: string; labelField: string; denormalizes?: string }
}

export interface FormSectionSubstitution {
  title: string
  grid: boolean
  fields: FormFieldSubstitution[]
}

/** Todo lo que la plantilla de la ficha necesita ya masticado (regla 8). */
export interface DetailSubstitution {
  /** Campo que titula la ficha */
  titleField: string
  /** Filas de datos, en orden, con su etiqueta y su formato */
  rows: string[]
}

/** Campos que pinta cada tarjeta, ya resueltos (regla 8). */
export interface GallerySubstitution {
  titleField: string
  subtitleField: string | null
  metricField: string | null
  metricLabel: string | null
  /** Hasta dos campos más, como chips */
  chips: { key: string; label: string }[]
}

/** Una tabla de registros hijos dentro de la ficha del padre. */
export interface RelatedSubstitution {
  /** Título de la sección (plural del hijo) */
  title: string
  /** Endpoint del hijo, ya con su prefijo */
  endpoint: string
  /** Campo del hijo que apunta al padre (pacienteId) */
  field: string
  /** Ruta del listado del hijo, para «ver todos» */
  route: string
  /** Columnas ya renderizadas como objetos literales */
  columns: string
}

export interface UiStrings {
  title: string
  subtitle: string
  loading: string
  error: string
  empty: string
  createLabel: string
  exportFilename: string
  toastCreated: string
  toastUpdated: string
  toastCreateError: string
  toastUpdateError: string
  viewLabel: string
  dialogEditTitle: string
  dialogEditDescription: string
  dialogCreateDescription: string
  deleteTitle: string
  deleteDescriptionSubject: string
  toastDeleted: string
  toastDeleteError: string
}

// Defaults derived from the schema field type; column.type / column.tsType override them.
const DEFAULT_COLUMN_TYPE: Record<FieldType, string> = {
  uuid: 'uuid',
  string: 'varchar',
  text: 'text',
  number: 'numeric',
  integer: 'int',
  boolean: 'boolean',
  date: 'date',
  timestamptz: 'timestamptz'
}

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

// All rendering logic lives here on purpose: templates stay dumb (project rule #8).
export function buildSubstitutions(definition: ResourceDefinition, others: ResourceDefinition[] = []): ResourceSubstitutions {
  const n = names(definition.name)
  const fields = Object.entries(definition.fields)
  const columns = fields.map(([name, field]) => renderColumn(name, field))
  const aggregate = renderAggregate(definition)

  return {
    className: n.className,
    propertyName: n.propertyName,
    fileName: n.fileName,
    pluralClassName: names(definition.plural).className,
    constantName: n.constantName,
    plural: definition.plural,
    context: definition.context,
    schemaName: definition.schemaName,
    constraintsConst: definition.constraintsConst,
    audit: definition.audit ?? false,
    auditComment: definition.auditComment ?? false,
    softDelete: definition.softDelete ?? false,
    needsNullable: columns.some(c => c.tsType.includes('Nullable<')),
    needsNumericTransformer: fields.some(([, f]) => f.column?.transformer === 'numeric'),
    needsNullableNumericTransformer: fields.some(([, f]) => f.column?.transformer === 'nullableNumeric'),
    typeormImports: renderTypeormImports(definition),
    columns,
    allowedFilters: orderedQueryList(fields, 'filterable'),
    allowedOrders: orderedQueryList(fields, 'sortable'),
    searchableFields: orderedQueryList(fields, 'searchable'),
    filterEntries: orderedQueryList(fields, 'filterable').map(name => ({
      name,
      comment: definition.fields[name].query?.filterNote ?? []
    })),
    searchNotes: definition.searchNotes ?? [],
    ordersNotes: definition.ordersNotes ?? [],
    constraintEntries: renderConstraints(definition),
    extraConstantBlocks: Object.entries(definition.extraConstants ?? {}).map(
      ([key, group]) =>
        `${key}: { ${Object.entries(group)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')} }`
    ),
    hasSharedConstraints: Object.values(definition.constraints ?? {}).some(v => typeof v === 'object' && 'shared' in v),
    toDomainProps: fields.map(([name, f]) => renderToDomainProp(name, f)),
    toPersistenceLines: fields.map(([name, f]) => renderToPersistenceLine(name, f)),
    route: definition.route ?? `/${definition.context}/${definition.plural}`,
    sharedDomainAlias: definition.sharedDomainAlias ?? '@acc/shared/domain',
    ui: renderUiStrings(definition),
    frontendColumns: renderFrontendColumns(definition),
    valueMapImports: [
      ...new Set(fields.map(([, f]) => f.table?.valueMapConst).filter((c): c is string => c !== undefined))
    ],
    features: resolveFeatures(definition),
    icons: renderIcons(resolveFeatures(definition)),
    deleteLabelField: definition.list?.deleteLabelField ?? 'name',
    dtoName: definition.dtoName ?? `${n.className}Dto`,
    api: definition.api ?? `/api/v1/${definition.plural}`,
    labelPlural: definition.labels?.plural ?? definition.plural,
    attachments: definition.attachments ?? false,
    detail: renderDetail(definition),
    gallery: renderGallery(definition),
    related: renderRelated(definition, others),
    apiResource: (definition.api ?? `/api/v1/${definition.plural}`).replace(/^\/api\/v1\//, ''),
    serviceSharedImports: renderServiceSharedImports(definition, n.className),
    angularCoreImports: renderAngularCoreImports(resolveFeatures(definition)),
    ...renderForm(definition, n.fileName),
    test: renderTestBindings(definition),
    vos: renderVos(definition, n.className),
    aggregate,
    app: renderApplication(definition, aggregate.emitAggregate),
    entry: renderEntrypoints(definition, aggregate.emitAggregate),
    domainTests: renderDomainTests(definition)
  }
}

function renderVos(definition: ResourceDefinition, className: string): VoSubstitution[] {
  const allFields = { ...definition.fields, ...(definition.composition?.fields ?? {}) }
  return Object.entries(allFields)
    .filter((entry): entry is [string, FieldDefinition & { vo: VoDefinition }] => typeof entry[1].vo === 'object')
    .map(([name, field]) => {
      const vo = field.vo
      const constraintKey = vo.constraintKey ?? constName(name)
      const kind = voKind(field, vo)
      const lengthN = `${definition.constraintsConst ?? `${constName(className)}_CONSTRAINTS`}.${constraintKey}`
      return {
        voClassName: vo.name,
        voFileName: names(vo.name).fileName,
        kind,
        fieldName: vo.fieldName,
        errorClass: `${className}Error`,
        constraintsConst: definition.constraintsConst ?? `${constName(className)}_CONSTRAINTS`,
        constraintKey,
        ensure: vo.ensure ?? 'defined',
        noInnerWhitespace: vo.noInnerWhitespace ?? false,
        minLength: vo.minLength ?? false,
        email: vo.email ?? false,
        lengthRule: vo.lengthRule,
        lengthMessage:
          vo.lengthRule === 'exact'
            ? (vo.lengthMessage ?? `${vo.fieldName} must be exactly \${${lengthN}.LENGTH} characters`)
            : `${vo.fieldName} must be at most \${${lengthN}.MAX} characters`,
        min: vo.min ?? false,
        unset: vo.unset ?? false,
        valuesUnion: (vo.values ?? []).map(v => `'${v}'`).join(' | '),
        valuesList: (vo.values ?? []).map(v => `'${v}'`).join(', '),
        valueTypeName: `${vo.name}Value`
      }
    })
}

function voKind(field: FieldDefinition, vo: VoDefinition): VoSubstitution['kind'] {
  if (vo.values?.length) return 'enum'
  if (field.type === 'uuid') return 'uuid'
  if (field.type === 'boolean') return 'boolean'
  if (field.type === 'integer') return 'integer'
  if (field.type === 'number') return 'number'
  if (field.column?.array) return 'stringArray'
  return 'string'
}

const SAMPLE_UUIDS = ['019eb713-19bb-7000-8000-000000000001', '019eb713-19bb-7000-8000-000000000002']

function renderTestBindings(definition: ResourceDefinition): TestBindings {
  const n = names(definition.name)
  const fields = Object.entries(definition.fields)
  const sortField = orderedQueryList(fields, 'sortable')[0] ?? 'id'
  const filterable = orderedQueryList(fields, 'filterable').filter(f => f !== 'id')
  const filterSamples = filterable.slice(0, 2).map(name => ({
    field: name,
    label: definition.fields[name].table?.label ?? definition.fields[name].form?.label ?? name,
    operator: definition.fields[name].form?.options ? 'eq' : 'starts_with',
    value: sampleScalar(name, definition.fields[name], 0)
  }))

  const required = fields.filter(([, f]) => f.required && f.form && f.form.control !== 'none')
  const createSampleLines = [
    `id: '${SAMPLE_UUIDS[0]}',`,
    ...required.map(([name, f], i) => `${name}: ${sampleScalar(name, f, i)},`)
  ]
    .map(line => line.replace(/,$/, ''))
    .map((line, i, arr) => (i < arr.length - 1 ? `${line},` : line))

  const checkbox = fields.find(([, f]) => f.form?.control === 'checkbox')
  const optionalText = fields.find(([, f]) => f.form?.control === 'text' && !f.required)
  const updateSampleSrc = checkbox
    ? `{ ${checkbox[0]}: true }`
    : optionalText
      ? `{ ${optionalText[0]}: ${sampleScalar(optionalText[0], optionalText[1], 0)} }`
      : `{}`

  const enums = [
    ...new Set(fields.map(([, f]) => f.form?.optionsType).filter((t): t is string => t !== undefined))
  ].sort()

  return {
    mockConst: `MOCK_${n.constantName}S_PAGINATED`,
    sortField,
    filterSamples,
    createSampleLines,
    updateSampleSrc,
    enumImports: enums.join(', '),
    mockItemBlocks: SAMPLE_UUIDS.map((id, index) => renderMockItem(definition, id, index))
  }
}

function sampleScalar(name: string, field: FieldDefinition, index: number): string {
  const form = field.form
  if (form?.optionsType && form.options?.length) {
    const option = form.options[index % form.options.length]
    return `${form.optionsType}.${option.value.toUpperCase()}`
  }
  if (form?.options?.length) return `'${form.options[index % form.options.length].value}'`
  if (form?.lookup || field.type === 'uuid') return `'${SAMPLE_UUIDS[1]}'`
  if (field.column?.array) return `['${names(name).className} ${index + 1}']`
  if (field.type === 'boolean') return index % 2 === 0 ? 'false' : 'true'
  if (field.type === 'number' || field.type === 'integer') return String(100 + index)
  if (field.type === 'date') return `'2026-0${index + 1}-15'`
  if (field.type === 'timestamptz') return `'2026-0${index + 1}-15T10:00:00.000Z'`
  return `'${names(name).className} ${index + 1}'`
}

function renderMockItem(definition: ResourceDefinition, id: string, index: number): string {
  const lines = Object.entries(definition.fields)
    .filter(([name]) => name !== 'id')
    .map(([name, f]) => `    ${name}: ${f.nullable && index === 1 ? 'null' : sampleScalar(name, f, index)}`)
  // Sin campos de auditoría: no están en el DTO ni los devuelve la API, y añadirlos
  // rompía la compilación del mock (la referencia tampoco los emite).
  return `  {\n    id: '${id}',\n${lines.join(',\n')}\n  }`
}

type FormBindings = Pick<
  ResourceSubstitutions,
  | 'formSections'
  | 'formValueLines'
  | 'formGroupLines'
  | 'formPatchLines'
  | 'dialogSharedImports'
  | 'needsSelect'
  | 'savedEmitLines'
  | 'formHelperLines'
  | 'lookupInjectLines'
  | 'lookupComputedLines'
  | 'lookupServiceImports'
  | 'labelsModuleImports'
  | 'groupValidatorDefs'
  | 'groupValidatorOption'
  | 'needsGroupValidatorTypes'
  | 'needsComputed'
  | 'inlineLabelConsts'
>

function renderForm(definition: ResourceDefinition, fileName: string): FormBindings {
  const idPrefix = fileName.charAt(0)
  const n = names(definition.name)
  const propertyName = n.propertyName
  const className = n.className
  const dtoName = definition.dtoName ?? `${className}Dto`

  const formFields = Object.entries(definition.fields)
    .filter(([, f]) => f.form && f.form.control !== 'none')
    .map(([name, f]) => renderFormField(name, f, idPrefix))

  const sections: FormSectionSubstitution[] = (definition.formSections ?? []).map(section => {
    const fields = formFields
      .filter(field => definition.fields[field.name].form?.section === section.id)
      .sort(
        (a, b) =>
          (definition.fields[a.name].form?.order ?? Number.MAX_SAFE_INTEGER) -
          (definition.fields[b.name].form?.order ?? Number.MAX_SAFE_INTEGER)
      )
    return { title: section.title, grid: fields.length > 1, fields }
  })

  const selects = formFields.filter(f => f.control === 'select')
  // La plantilla emite [itemToString]="<campo>ToLabel" en TODO select, así que el helper
  // (y su constante de etiquetas) debe existir tanto si el campo declara optionsType como si no.
  const enumSelects = selects.filter(f => f.optionsType || f.options.length)
  const lookups = formFields.filter(f => f.lookup)
  const denorms = lookups.map(f => f.lookup?.denormalizes).filter((d): d is string => d !== undefined)

  // FormValue: campos declarados (enum-typed o string) + denormalizados por lookup (string)
  const formValueLines = [...formFields.map(f => `${f.name}: ${valueType(f)}`), ...denorms.map(d => `${d}: string`)]

  // Shared imports: DTO + enums de los selects tipados (labels van por su propio import)
  const sharedTypes = [...new Set([dtoName, ...enumSelects.map(f => f.optionsType as string)])].sort()

  // Label consts: inline si labelsConst ausente; import si presente
  const inlineLabelFields = enumSelects.filter(f => !f.labelsConst)
  const labelsModuleImports = [
    ...new Set(enumSelects.filter(f => f.labelsConst).map(f => f.labelsConst as string))
  ].sort()

  const groupValidators = definition.formGroupValidators ?? []

  return {
    formSections: sections,
    formValueLines,
    formGroupLines: formFields.map(renderFormGroupLine),
    formPatchLines: formFields.map(f => renderFormPatchLine(f, propertyName, definition.fields[f.name])),
    dialogSharedImports: sharedTypes.join(', '),
    needsSelect: selects.length > 0,
    savedEmitLines: renderSavedEmit(formFields, lookups),
    // la plantilla solo puede leer miembros de la clase: se expone la constante
    formHelperLines: enumSelects
      .filter(f => !f.lookup && f.optionsConst)
      .map(f => `protected readonly ${f.name}Options = ${f.optionsConst}`),
    lookupInjectLines: lookups.map(
      f => `private readonly _${f.lookup?.resource}Service = inject(${cap(f.lookup?.resource ?? '')}Service)`
    ),
    lookupComputedLines: lookups.flatMap(f => [
      `readonly ${f.lookup?.resource}s = computed(() => this._${f.lookup?.resource}Service.${f.lookup?.resource}s.value()?.items ?? [])`,
      `protected readonly ${f.name}Options = computed<AppSelectOption[]>(() =>`,
      `  this.${f.lookup?.resource}s().map(item => ({ value: item.id, label: item.${f.lookup?.labelField} }))`,
      `)`
    ]),
    lookupServiceImports: [...new Set(lookups.map(f => f.lookup?.resource ?? ''))],
    labelsModuleImports,
    groupValidatorDefs: groupValidators.map(renderGroupValidatorDef),
    groupValidatorOption: groupValidators.length
      ? `,\n    { validators: ${groupValidators.map(v => `${v.kind}Validator`).join(', ')} }`
      : '',
    needsGroupValidatorTypes: groupValidators.length > 0,
    needsComputed: lookups.length > 0,
    // app-select recibe las opciones tipadas y resuelve la etiqueta por su cuenta:
    // ya no hace falta un Record de etiquetas ni un helper itemToString por campo.
    inlineLabelConsts: enumSelects
      .filter(f => !f.lookup && f.options.length)
      .map(f => {
        const entries = f.options.map(o => `  { value: '${o.value}', label: '${o.label}' }`).join(',\n')
        return `const ${constName(f.name)}_OPTIONS: AppSelectOption[] = [\n${entries}\n]`
      })
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function constName(name: string): string {
  return name.replace(/([A-Z])/g, '_$1').toUpperCase()
}

function valueType(field: FormFieldSubstitution): string {
  if (field.optionsType) return field.optionsType
  if (field.control === 'checkbox') return 'boolean'
  if (field.control === 'number') return field.required ? 'number' : 'number | undefined'
  if (field.control === 'date') return field.required ? 'string' : 'string | null'
  return 'string'
}

function renderHelpers(
  inlineLabelFields: FormFieldSubstitution[],
  importedLabelFields: FormFieldSubstitution[],
  lookups: FormFieldSubstitution[]
): string[] {
  const lines: string[] = []
  for (const f of [...inlineLabelFields, ...importedLabelFields]) {
    const labelConst = f.labelsConst ?? `${constName(f.name)}_LABELS`
    // Sin optionsType no hay tipo al que castear: String(value) evita indexar con unknown.
    const key = f.optionsType ? `value as ${f.optionsType}` : 'String(value)'
    lines.push(`protected readonly ${f.name}ToLabel = (value: unknown): string => ${labelConst}[${key}] ?? ''`)
  }
  for (const f of lookups) {
    const resource = f.lookup?.resource ?? ''
    const labelField = f.lookup?.labelField ?? 'name'
    lines.push(
      `protected readonly ${f.name}ToLabel = (value: unknown): string => this.${resource}s().find(item => item.id === value)?.${labelField} ?? ''`
    )
  }
  return lines
}

function renderSavedEmit(formFields: FormFieldSubstitution[], lookups: FormFieldSubstitution[]): string[] {
  const casts = formFields
    .filter(f => f.optionsType && !f.default)
    .map(f => `${f.name}: raw.${f.name} as ${f.optionsType}`)
  // Select propio (sin optionsType ni lookup): el control es string | null por el placeholder.
  const selectCasts = formFields
    .filter(f => f.control === 'select' && !f.optionsType && !f.lookup && !f.default)
    .map(f => `${f.name}: raw.${f.name} as string`)
  // Numérico requerido: el control es number | null porque el input vacío no es 0.
  const numberCasts = formFields
    .filter(f => f.control === 'number')
    .map(f =>
      f.required
        ? `${f.name}: raw.${f.name} as number`
        : // el DTO declara `campo?: number`: un input vacío es undefined, nunca null
          `${f.name}: raw.${f.name} ?? undefined`
    )
  const lookupFixes = lookups.map(f => `${f.name}: raw.${f.name} ?? ''`)
  const denormLines = lookups
    .filter(f => f.lookup?.denormalizes)
    .map(
      f =>
        `${f.lookup?.denormalizes}: this.${f.lookup?.resource}s().find(item => item.id === raw.${f.name})?.${f.lookup?.labelField} ?? ''`
    )
  const dateNulls = formFields
    .filter(f => f.control === 'date' && !f.required)
    .map(f => `${f.name}: raw.${f.name} || null`)
  const extras = [...casts, ...selectCasts, ...numberCasts, ...lookupFixes, ...denormLines, ...dateNulls]
  if (!extras.length) return ['this.saved.emit(raw)']
  return ['this.saved.emit({', `  ...raw,`, ...extras.map(e => `  ${e},`), '})']
}

function renderGroupValidatorDef(v: { kind: string; startField: string; endField: string }): string {
  if (v.kind === 'dateRange') {
    return [
      `const dateRangeValidator = (group: AbstractControl): ValidationErrors | null => {`,
      `  const start = group.get('${v.startField}')?.value`,
      `  const end = group.get('${v.endField}')?.value`,
      `  return start && end && end < start ? { dateRange: true } : null`,
      `}`
    ].join('\n')
  }
  return ''
}

function renderFormField(name: string, field: FieldDefinition, idPrefix: string): FormFieldSubstitution {
  const form = field.form as NonNullable<FieldDefinition['form']>
  return {
    name,
    id: `${idPrefix}${form.id ?? name}`,
    label: form.label ?? name,
    control: form.control as FormFieldSubstitution['control'],
    rows: form.rows,
    required: field.required ?? false,
    options: form.options ?? [],
    optionsType: form.optionsType,
    default: form.default,
    placeholder: form.placeholder,
    labelsConst: form.labelsConst,
    // constante con las opciones tipadas que consume <app-select>
    optionsConst:
      form.control === 'select' && !form.lookup && (form.options?.length ?? 0) > 0
        ? `${constName(name)}_OPTIONS`
        : undefined,
    groupErrorMessage: form.groupErrorMessage,
    maxLength: form.maxLength,
    fullWidth: form.fullWidth,
    lookup: form.lookup
  }
}

function renderFormGroupLine(field: FormFieldSubstitution): string {
  if (field.control === 'checkbox') return `${field.name}: [${field.default ?? 'false'}]`
  if (field.lookup) {
    const comment = "// null (no ''): hlm-select solo muestra el placeholder cuando el valor es null."
    return `${comment}\n    ${field.name}: this._fb.control<string | null>(null${field.required ? ', Validators.required' : ''})`
  }
  if (field.control === 'select') {
    if (field.default) return `${field.name}: [${field.default}]`
    const comment = "// null (no ''): hlm-select solo muestra el placeholder cuando el valor es null."
    return `${comment}\n    ${field.name}: this._fb.control<string | null>(null${field.required ? ', Validators.required' : ''})`
  }
  if (field.control === 'number') {
    // number | null: el input vacío no es '' sino null, y el DTO espera un número.
    const validators = field.required ? ', Validators.required' : ''
    return `${field.name}: this._fb.control<number | null>(${field.default ?? 'null'}${validators})`
  }
  if (field.default) return `${field.name}: [${field.default}]`
  if (field.required && field.maxLength) {
    return `${field.name}: ['', [Validators.required, Validators.maxLength(${field.maxLength})]]`
  }
  if (field.maxLength) return `${field.name}: ['', Validators.maxLength(${field.maxLength})]`
  return field.required ? `${field.name}: ['', Validators.required]` : `${field.name}: ['']`
}

function renderFormPatchLine(field: FormFieldSubstitution, propertyName: string, definition: FieldDefinition): string {
  if (field.control === 'checkbox') return `${field.name}: ${propertyName}.${field.name}`
  if (field.lookup) return `${field.name}: ${propertyName}.${field.name}`
  if (field.control === 'select' && !field.default) return `${field.name}: ${propertyName}.${field.name} ?? null`
  if (field.control === 'select') return `${field.name}: ${propertyName}.${field.name}`
  if (definition.required && !definition.nullable) return `${field.name}: ${propertyName}.${field.name}`
  return `${field.name}: ${propertyName}.${field.name} ?? ''`
}

function renderServiceSharedImports(definition: ResourceDefinition, className: string): string {
  const dtoName = definition.dtoName ?? `${className}Dto`
  const edit = definition.list?.features?.edit ?? true
  const types = edit
    ? [dtoName, 'ExportFormat', `Register${className}Dto`, `Update${className}Dto`]
    : [dtoName, 'ExportFormat']
  return types.sort().join(', ')
}

function renderAngularCoreImports(features: { edit: boolean; delete: boolean }): string {
  const base = ['ChangeDetectionStrategy', 'Component', 'computed', 'inject', 'linkedSignal']
  if (features.edit || features.delete) base.push('signal')
  return base.join(', ')
}

function resolveFeatures(definition: ResourceDefinition): { view: boolean; delete: boolean; edit: boolean } {
  return {
    view: definition.list?.features?.view ?? true,
    delete: definition.list?.features?.delete ?? false,
    edit: definition.list?.features?.edit ?? true
  }
}

function renderIcons(features: { view: boolean; delete: boolean; edit: boolean }): string[] {
  const icons: string[] = []
  if (features.view) icons.push('lucideEye')
  if (features.edit) icons.push('lucidePencil')
  if (features.delete) icons.push('lucideTrash2')
  return icons
}

function renderUiStrings(definition: ResourceDefinition): UiStrings {
  const labels = definition.labels ?? { singular: definition.name, plural: definition.plural }
  const singular = labels.singular
  const plural = labels.plural
  const lowerSingular = singular.toLowerCase()
  const lowerPlural = plural.toLowerCase()
  const feminine = labels.gender === 'f'
  const article = feminine ? 'la' : 'el'
  const suffix = feminine ? 'a' : 'o'

  return {
    title: plural,
    subtitle: labels.subtitle ?? '',
    loading: `Cargando ${lowerPlural}…`,
    error: `No se pudieron cargar ${feminine ? 'las' : 'los'} ${lowerPlural}`,
    empty: `No hay ${lowerPlural} registrad${suffix}s`,
    createLabel: `Nuev${suffix} ${lowerSingular}`,
    exportFilename: lowerPlural,
    toastCreated: `${singular} cread${suffix} correctamente`,
    toastUpdated: `${singular} actualizad${suffix} correctamente`,
    toastCreateError: `No se pudo crear ${article} ${lowerSingular}`,
    toastUpdateError: `No se pudo actualizar ${article} ${lowerSingular}`,
    viewLabel: definition.list?.viewLabel ?? 'Ver ficha',
    dialogEditTitle: `Editar ${lowerSingular}`,
    dialogEditDescription: `Modifica los datos ${feminine ? 'de la' : 'del'} ${lowerSingular}`,
    dialogCreateDescription: `Introduce los datos ${feminine ? 'de la nueva' : 'del nuevo'} ${lowerSingular}`,
    deleteTitle: `Eliminar ${lowerSingular}`,
    deleteDescriptionSubject: `${article} ${lowerSingular}`,
    toastDeleted: `${singular} eliminad${suffix}`,
    toastDeleteError: `No se pudo eliminar ${article} ${lowerSingular}`
  }
}

/**
 * Ficha (spec 16): se deriva de los campos. El título es el primer campo de
 * texto buscable —el mismo criterio que usa el estudio al crear la entidad— y
 * las filas salen de las columnas del listado más los campos del formulario,
 * que juntos son «lo que el usuario reconoce» de la entidad.
 */
function renderDetail(definition: ResourceDefinition): DetailSubstitution | null {
  const { detail } = definition
  if (!detail) return null

  const fields = Object.entries(definition.fields)
  const firstText = fields.find(([, f]) => f.type === 'string' && f.query?.searchable)?.[0]
  const titleField = detail.title ?? firstText ?? fields.find(([, f]) => !f.pk)?.[0] ?? 'id'

  const shown =
    detail.fields ??
    fields
      // el id de una referencia es un uuid: en la ficha se ve su nombre denormalizado
      .filter(([, f]) => !f.relation)
      .filter(([, f]) => f.table?.show || (f.form && f.form.control !== 'none'))
      .map(([name]) => name)

  const rows = shown
    .filter(name => name !== titleField)
    .map(name => {
      const field = definition.fields[name]
      const label = field?.table?.label ?? field?.form?.label ?? name
      const type = field?.table?.type === 'date' || field?.type === 'date' ? 'date' : detailValueType(field)
      return `{ key: '${name}', label: '${label}'${type ? `, type: '${type}'` : ''} }`
    })

  return { titleField, rows }
}

/**
 * Galería (spec 17): título = primer texto buscable, subtítulo = siguiente texto,
 * métrica = primer número. Los chips son los dos campos restantes que la tabla
 * muestra — lo justo para que la tarjeta diga algo sin convertirse en una ficha.
 */
function renderGallery(definition: ResourceDefinition): GallerySubstitution | null {
  const { gallery } = definition
  if (!gallery) return null

  const fields = Object.entries(definition.fields).filter(([, f]) => !f.pk)
  const texts = fields.filter(([, f]) => f.type === 'string' || f.type === 'text')
  // el decimal manda sobre el entero: en una tarjeta el importe pesa más que
  // una duración o un contador
  const numbers = [
    ...fields.filter(([, f]) => f.type === 'number'),
    ...fields.filter(([, f]) => f.type === 'integer')
  ]

  const titleField = gallery.title ?? texts.find(([, f]) => f.query?.searchable)?.[0] ?? texts[0]?.[0] ?? fields[0][0]
  const subtitleField = gallery.subtitle ?? texts.map(([name]) => name).find(name => name !== titleField) ?? null
  const metricField = gallery.metric ?? numbers[0]?.[0] ?? null
  const labelOf = (name: string): string =>
    definition.fields[name]?.table?.label ?? definition.fields[name]?.form?.label ?? name

  const chips = fields
    .filter(([name, f]) => f.table?.show && ![titleField, subtitleField, metricField].includes(name))
    .slice(0, 2)
    .map(([name]) => ({ key: name, label: labelOf(name) }))

  return {
    titleField,
    subtitleField,
    metricField,
    metricLabel: metricField ? labelOf(metricField) : null,
    chips
  }
}

/**
 * Drill-down derivado (ADR-002 punto 4): las entidades que declaran una
 * referencia a esta se muestran en su ficha como una tabla filtrada por el id
 * del padre. Nunca un join: una consulta al listado del hijo con un filtro.
 */
function renderRelated(definition: ResourceDefinition, others: ResourceDefinition[]): RelatedSubstitution[] {
  return others
    .filter(other => other.name !== definition.name)
    .flatMap(other => {
      const link = Object.entries(other.fields).find(
        ([, field]) => field.relation?.kind === 'reference' && field.relation.to === definition.name
      )
      if (!link) return []

      const columns = Object.entries(other.fields)
        .filter(([name, field]) => field.table?.show && name !== link[0])
        .sort(([, a], [, b]) => (a.table?.order ?? 99) - (b.table?.order ?? 99))
        .slice(0, 4)
        .map(([name, field]) => `{ key: '${name}', label: '${field.table?.label ?? name}' }`)

      return [
        {
          title: other.labels?.plural ?? other.plural,
          endpoint: other.api ?? `/api/v1/${other.plural}`,
          field: link[0],
          route: other.route ?? `/${other.context}/${other.plural}`,
          columns: `[${columns.join(', ')}]`
        }
      ]
    })
}

function detailValueType(field: FieldDefinition | undefined): string | null {
  if (!field) return null
  if (field.type === 'boolean') return 'boolean'
  if (field.type === 'integer' || field.type === 'number') return 'number'
  return null
}

/** Columnas del listado, ya ordenadas y renderizadas (regla 8). */
export function renderFrontendColumns(definition: ResourceDefinition): string[] {
  const fields = Object.entries(definition.fields)

  return [
    ...fields.filter(([, f]) => f.table?.show).map(([name, f]) => [name, f.table as FieldTable, f] as const),
    ...Object.entries(definition.list?.virtualColumns ?? {}).map(([name, table]) => [name, table, undefined] as const)
  ]
    .sort(([, a], [, b]) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
    .map(([name, table, field]) =>
      renderFrontendColumn(name, {
        // un booleano se lee Sí/No, igual que en la ficha (defecto 17)
        ...(field?.type === 'boolean' && !table.type ? { type: 'boolean' as const } : {}),
        ...table
      })
    )
}

function renderFrontendColumn(name: string, table: FieldTable): string {
  const parts = [`key: '${name}'`, `label: '${table.label}'`]
  if (table.filterable) parts.push('filterable: true')
  if (table.sortable === false) parts.push('sortable: false')
  if (table.type === 'date' || table.type === 'number' || table.type === 'boolean') {
    parts.push(`type: '${table.type}'`)
  }
  if (table.minWidth !== undefined) parts.push(`minWidth: ${table.minWidth}`)
  if (table.valueMapConst) parts.push(`valueMap: ${table.valueMapConst}`)
  if (table.type === 'badge' && table.badgeMap) {
    parts.push(`type: 'badge'`)
    const entries = Object.entries(table.badgeMap)
      .map(([key, badge]) => `      ${key}: { label: '${badge.label}', variant: '${badge.variant}' }`)
      .join(',\n')
    parts.push(`badgeMap: {\n${entries}\n    }`)
    // objeto expandido: prettier preserva la multilinea, como en el módulo de oro
    return `{\n    ${parts.join(',\n    ')}\n  }`
  }
  return `{ ${parts.join(', ')} }`
}

type QueryFlag = 'filterable' | 'sortable' | 'searchable'

function orderedQueryList(fields: [string, FieldDefinition][], flag: QueryFlag): string[] {
  const flagged = fields
    .map(([name, f], index) => ({ name, value: f.query?.[flag], index }))
    .filter(e => e.value !== undefined && e.value !== false)
  return flagged
    .sort((a, b) => {
      const av = typeof a.value === 'number' ? a.value : Number.MAX_SAFE_INTEGER + a.index
      const bv = typeof b.value === 'number' ? b.value : Number.MAX_SAFE_INTEGER + b.index
      return av - bv
    })
    .map(e => e.name)
}

function renderConstraints(definition: ResourceDefinition): string[] {
  return Object.entries(definition.constraints ?? {}).map(
    ([key, value]) => `${key}: ${renderConstraintValue(key, value)}`
  )
}

function renderConstraintValue(key: string, value: ConstraintValue): string {
  if (typeof value === 'number') return String(value)
  if ('shared' in value) return `SHARED_CONSTRAINTS.${value.shared === true ? key : value.shared}`
  const entries = Object.entries(value).map(
    ([k, v]) => `${k}: ${typeof v === 'number' ? v : renderConstraintValue(k, v)}`
  )
  const hasNestedGroups = Object.values(value).some(v => typeof v === 'object')
  // prettier preserva la expansión multilinea de objetos: los grupos anidados se emiten expandidos como en el canon
  if (hasNestedGroups) return `{\n    ${entries.join(',\n    ')}\n  }`
  return `{ ${entries.join(', ')} }`
}

function isNullableDate(field: FieldDefinition): boolean {
  return field.column?.tsType === 'Nullable<Date>'
}

function renderToDomainProp(name: string, field: FieldDefinition): string {
  if (isNullableDate(field)) return `${name}: entity.${name}?.toISOString() ?? null`
  return `${name}: entity.${name}`
}

function renderToPersistenceLine(name: string, field: FieldDefinition): string {
  if (isNullableDate(field)) {
    return `entity.${name} = primitives.${name} ? new Date(primitives.${name}) : null`
  }
  if (field.optionalPrimitive || field.syncManaged) {
    const fallback = field.column?.default !== undefined ? renderLiteral(field.column.default) : 'null'
    return `entity.${name} = primitives.${name} ?? ${fallback}`
  }
  return `entity.${name} = primitives.${name}`
}

function renderTypeormImports(definition: ResourceDefinition): string {
  const fields = Object.values(definition.fields)
  const imports = ['Entity']
  if (fields.some(f => f.pk)) imports.push('PrimaryColumn')
  if (fields.some(f => !f.pk)) imports.push('Column')
  if (definition.audit) imports.push('CreateDateColumn', 'UpdateDateColumn')
  if (definition.softDelete) imports.push('DeleteDateColumn')
  return imports.sort().join(', ')
}

function renderColumn(name: string, field: FieldDefinition): ColumnSubstitution {
  const columnType = field.column?.type ?? DEFAULT_COLUMN_TYPE[field.type]
  const optionsSrc = renderOptions(field)

  return {
    name,
    tsType: field.column?.tsType ?? DEFAULT_TS_TYPE[field.type],
    decorator: field.pk ? 'PrimaryColumn' : 'Column',
    argsSrc: optionsSrc ? `'${columnType}', ${optionsSrc}` : `'${columnType}'`,
    comment: field.comment ?? []
  }
}

// Entries are emitted in the reference codebase's property order so the golden diff stays empty.
function renderOptions(field: FieldDefinition): string | undefined {
  const column: ColumnDefinition | undefined = field.column
  const entries: string[] = []

  if (column?.length !== undefined) entries.push(`length: ${column.length}`)
  if (column?.lengthConst !== undefined) entries.push(`length: LIMITS.${column.lengthConst}`)
  if (column?.precision !== undefined) entries.push(`precision: ${column.precision}`)
  if (column?.scale !== undefined) entries.push(`scale: ${column.scale}`)
  if (column?.array) entries.push('array: true')
  if (field.nullable) entries.push('nullable: true')
  if (column?.default !== undefined) entries.push(`default: ${renderLiteral(column.default)}`)
  if (column?.defaultRaw !== undefined) entries.push(`default: () => ${column.defaultRaw}`)
  if (column?.transformer === 'numeric') entries.push('transformer: numericTransformer')
  if (column?.transformer === 'nullableNumeric') entries.push('transformer: nullableNumericTransformer')

  return entries.length ? `{ ${entries.join(', ')} }` : undefined
}

function renderLiteral(value: string | number | boolean): string {
  return typeof value === 'string' ? `'${value}'` : String(value)
}
