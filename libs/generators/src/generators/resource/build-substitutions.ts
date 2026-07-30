import { names } from '@nx/devkit'
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
  constantName: string
  plural: string
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
}

export interface VoSubstitution {
  voClassName: string
  voFileName: string
  kind: 'string' | 'enum' | 'number' | 'integer' | 'boolean' | 'stringArray'
  fieldName: string
  errorClass: string
  constraintsConst: string
  constraintKey: string
  ensure: 'defined' | 'string'
  noInnerWhitespace: boolean
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
  control: 'text' | 'textarea' | 'select' | 'date' | 'checkbox'
  rows?: number
  required: boolean
  options: { value: string; label: string }[]
  optionsType?: string
  default?: string
  placeholder?: string
  labelsConst?: string
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
export function buildSubstitutions(definition: ResourceDefinition): ResourceSubstitutions {
  const n = names(definition.name)
  const fields = Object.entries(definition.fields)
  const columns = fields.map(([name, field]) => renderColumn(name, field))

  return {
    className: n.className,
    propertyName: n.propertyName,
    fileName: n.fileName,
    constantName: n.constantName,
    plural: definition.plural,
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
    frontendColumns: [
      ...fields.filter(([, f]) => f.table?.show).map(([name, f]) => [name, f.table as FieldTable] as const),
      ...Object.entries(definition.list?.virtualColumns ?? {})
    ]
      .sort(([, a], [, b]) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
      .map(([name, table]) => renderFrontendColumn(name, table)),
    valueMapImports: [
      ...new Set(fields.map(([, f]) => f.table?.valueMapConst).filter((c): c is string => c !== undefined))
    ],
    features: resolveFeatures(definition),
    icons: renderIcons(resolveFeatures(definition)),
    deleteLabelField: definition.list?.deleteLabelField ?? 'name',
    dtoName: definition.dtoName ?? `${n.className}Dto`,
    api: definition.api ?? `/api/v1/${definition.plural}`,
    serviceSharedImports: renderServiceSharedImports(definition, n.className),
    angularCoreImports: renderAngularCoreImports(resolveFeatures(definition)),
    ...renderForm(definition, n.fileName),
    test: renderTestBindings(definition),
    vos: renderVos(definition, n.className)
  }
}

function renderVos(definition: ResourceDefinition, className: string): VoSubstitution[] {
  return Object.entries(definition.fields)
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
  if (definition.audit) {
    lines.push(
      `    createdAt: '2026-01-0${index + 1}T09:00:00.000Z'`,
      `    updatedAt: '2026-01-0${index + 1}T09:00:00.000Z'`
    )
  }
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
  const enumSelects = selects.filter(f => f.optionsType)
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
    formHelperLines: renderHelpers(
      inlineLabelFields,
      enumSelects.filter(f => f.labelsConst),
      lookups
    ),
    lookupInjectLines: lookups.map(
      f => `private readonly _${f.lookup?.resource}Service = inject(${cap(f.lookup?.resource ?? '')}Service)`
    ),
    lookupComputedLines: lookups.map(
      f =>
        `readonly ${f.lookup?.resource}s = computed(() => this._${f.lookup?.resource}Service.${f.lookup?.resource}s.value()?.items ?? [])`
    ),
    lookupServiceImports: [...new Set(lookups.map(f => f.lookup?.resource ?? ''))],
    labelsModuleImports,
    groupValidatorDefs: groupValidators.map(renderGroupValidatorDef),
    groupValidatorOption: groupValidators.length
      ? `,\n    { validators: ${groupValidators.map(v => `${v.kind}Validator`).join(', ')} }`
      : '',
    needsGroupValidatorTypes: groupValidators.length > 0,
    needsComputed: lookups.length > 0,
    inlineLabelConsts: inlineLabelFields.map(f => {
      const entries = f.options.map(o => `  ${o.value}: '${o.label}'`).join(',\n')
      return `const ${constName(f.name)}_LABELS: Record<string, string> = {\n${entries}\n}`
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
    const cast = f.optionsType ? ` as ${f.optionsType}` : ''
    lines.push(`protected readonly ${f.name}ToLabel = (value: unknown): string => ${labelConst}[value${cast}] ?? ''`)
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
  const extras = [...casts, ...lookupFixes, ...denormLines, ...dateNulls]
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

function renderFrontendColumn(name: string, table: FieldTable): string {
  const parts = [`key: '${name}'`, `label: '${table.label}'`]
  if (table.filterable) parts.push('filterable: true')
  if (table.sortable === false) parts.push('sortable: false')
  if (table.type === 'date' || table.type === 'number') parts.push(`type: '${table.type}'`)
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
  if (field.optionalPrimitive) {
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
