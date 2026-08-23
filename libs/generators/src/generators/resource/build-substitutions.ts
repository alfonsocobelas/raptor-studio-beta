import { names } from '@nx/devkit'
import { MODELS } from './models/registry'
import { AggregateBindings, renderAggregate } from './build-aggregate'
import { ApplicationBindings, renderApplication } from './build-application'
import { EntrypointBindings, renderEntrypoints } from './build-entrypoints'
import { DomainTestBindings, renderDomainTests } from './build-tests'
import { buildDenormalizations } from './denormalization'
import {
  buildDragPlan,
  buildDragTree,
  draggedRelations,
  dragModules,
  softDeleteContract,
  type DraggedRelation,
  type DragLevel,
  type DragModule,
  type DragPlanLevel
} from './drag-tree'
import {
  ColumnDefinition,
  ConstraintValue,
  FieldDefinition,
  FieldTable,
  FieldType,
  ResourceDefinition,
  VoDefinition,
  wantsSoftDelete
} from '@raptor/schema'

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
  features: { view: boolean; delete: boolean; edit: boolean; trash: boolean; history: boolean; import: boolean }
  /** lucide icons required by the enabled actions */
  icons: string[]
  /** Comentario de las acciones de fila en el listado con ficha */
  rowActionsComment: string[]
  /** Spread de las acciones de escritura (editar/borrar) en el listado con ficha */
  rowWriteActions: string[]
  deleteLabelField: string
  dtoName: string
  api: string
  /** Etiqueta plural legible (para comentarios y títulos emitidos) */
  labelPlural: string
  /** El recurso emite el bloque de adjuntos (spec 14) */
  attachments: boolean
  /** El recurso declara máquina de estados (spec 43): emite el error de transición */
  hasStateMachine: boolean
  /** Ficha del registro (spec 16): null cuando el modelo no la declara */
  detail: DetailSubstitution | null
  /** La página-formulario está declarada (spec 48): emite findOne aunque no haya ficha */
  formPage: boolean
  /** Galería de tarjetas (spec 17): null cuando el modelo no la declara */
  gallery: GallerySubstitution | null
  gantt: GanttSubstitution | null
  /** Calendario mensual (spec 59): null cuando el modelo no lo declara */
  calendar: CalendarSubstitution | null
  labelsModule: LabelsModuleSubstitution | null
  importCsv: ImportSubstitution | null
  /** Entidades que REFERENCIAN a esta: sus tablas cuelgan de la ficha (spec 15) */
  related: RelatedSubstitution[]
  /** Niveles que arrastra el borrado suave, en orden de marcado (spec 38) */
  dragTree: DragLevel[]
  /** Referencias por las que esta entidad puede ser arrastrada (spec 38) */
  dragged: DraggedRelation[]
  /** Plan de marcado del use case del padre, ya renderizado (spec 38 TASK-05) */
  dragPlan: DragPlanLevel[]
  /** Módulos Nest de los niveles del árbol, para la DI cruzada */
  dragModules: DragModule[]
  /** La entidad participa del contrato suave: firma con op, restoreByOp, import del VO */
  softContract: boolean
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
  /** Solo los enums del form (sin el DTO): lo que importa la página-formulario (spec 48) */
  formEnumImports: string
  /** Providers de TestBed que mockean los servicios de lookup en el spec de la página (spec 48) */
  formPageLookupProviders: string[]
  needsSelect: boolean
  savedEmitLines: string[]
  /** const value = … con los mismos ajustes que savedEmitLines, para la página-formulario (spec 48) */
  formValueBuildLines: string[]
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
  /** Solo el VO del campo promovido a estado (spec 43): factorías semánticas y predicados */
  stateMachine?: { initial: string; values: { value: string; method: string; predicate: string }[] }
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
/** Módulo <entity>-labels (spec 04): un Record exhaustivo por enum, con etiquetas del propio modelo. */
export interface LabelsModuleSubstitution {
  /** Enums importados del shared-domain, en orden alfabético */
  enumImports: string[]
  consts: { name: string; enumName: string; entries: { memberKey: string; label: string }[] }[]
}

/** Import CSV (spec 33): columnas del alta con su tipo, para parsear y coaccionar en el diálogo. */
export interface ImportSubstitution {
  columns: { name: string; kind: 'text' | 'number' | 'boolean' | 'date' }[]
}

/** Cronograma (spec 30): la barra se etiqueta y se sitúa con campos resueltos aquí, no en runtime. */
export interface GanttSubstitution {
  titleField: string
  startField: string
  endField: string
}

/** Calendario (spec 59): campos resueltos y leyenda pre-masticada para la plantilla tonta. */
export interface CalendarSubstitution {
  dateField: string
  labelField: string
  /** Etiqueta humana del campo fecha, para el pie del calendario */
  dateLabel: string
  colorField: string | null
  /** Valores del enum de color en su orden declarado; el color va por posición */
  legend: { value: string; label: string; colorIndex: number }[]
  weekends: boolean
  /** Cabeceras de la rejilla, ya recortadas si el fin de semana se oculta */
  dayNames: string[]
}

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
  /** Frase completa antes del nombre del registro (spec 38) */
  deleteDescriptionPrefix: string
  /** Cierre de la frase: archivar avisa del arrastre y de la papelera; físico, de la permanencia */
  deleteDescriptionSuffix: string
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
export function buildSubstitutions(
  definition: ResourceDefinition,
  others: ResourceDefinition[] = []
): ResourceSubstitutions {
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
    softDelete: wantsSoftDelete(definition),
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
    sharedDomainAlias: definition.sharedDomainAlias ?? '@raptor/shared/domain',
    ui: renderUiStrings(definition, wantsSoftDelete(definition) ? buildDragTree(definition, others).length > 0 : false),
    frontendColumns: renderFrontendColumns(definition),
    valueMapImports: [
      ...new Set(fields.map(([, f]) => f.table?.valueMapConst).filter((c): c is string => c !== undefined))
    ],
    features: resolveFeatures(definition),
    icons: renderIcons(resolveFeatures(definition)),
    rowActionsComment: renderRowActionsComment(resolveFeatures(definition)),
    rowWriteActions: renderRowWriteActions(resolveFeatures(definition), definition.access !== undefined),
    deleteLabelField: pickDeleteLabelField(definition),
    dtoName: definition.dtoName ?? `${n.className}Dto`,
    api: definition.api ?? `/api/v1/${definition.plural}`,
    labelPlural: definition.labels?.plural ?? definition.plural,
    attachments: definition.attachments ?? false,
    hasStateMachine: definition.state !== undefined,
    detail: renderDetail(definition),
    formPage: Boolean(definition.form),
    gallery: renderGallery(definition),
    gantt: renderGantt(definition),
    calendar: renderCalendar(definition),
    labelsModule: renderLabelsModule(definition),
    importCsv: renderImportCsv(definition),
    related: renderRelated(definition, others),
    dragTree: wantsSoftDelete(definition) ? buildDragTree(definition, others) : [],
    // el plan solo existe donde hay use case de borrado que lo ejecute: sin removes,
    // importar los módulos hijos sería DI muerta (visto en customer/contract del oro)
    dragPlan:
      wantsSoftDelete(definition) && definition.list?.features?.delete === true
        ? buildDragPlan(definition, buildDragTree(definition, others), `${n.propertyName}Id.value`)
        : [],
    // + los módulos de los orígenes de denormalización (spec 60): el use case de escritura
    // inyecta su repositorio para copiar el canon, así que la DI también cruza módulos.
    dragModules: mergeModules(
      wantsSoftDelete(definition) && definition.list?.features?.delete === true
        ? dragModules(buildDragTree(definition, others))
        : [],
      buildDenormalizations(definition, others).map(d => ({
        className: `${names(d.originPlural).className}Module`,
        importLine: `import { ${names(d.originPlural).className}Module } from '../${d.originPlural}/${d.originPlural}.module'`
      }))
    ),
    dragged: draggedRelations(definition),
    softContract: softDeleteContract(definition),
    apiResource: (definition.api ?? `/api/v1/${definition.plural}`).replace(/^\/api\/v1\//, ''),
    serviceSharedImports: renderServiceSharedImports(definition, n.className),
    angularCoreImports: renderAngularCoreImports(resolveFeatures(definition)),
    ...renderForm(definition, n.fileName),
    test: renderTestBindings(definition),
    vos: renderVos(definition, n.className),
    aggregate,
    app: renderApplication(definition, aggregate.emitAggregate, others),
    entry: renderEntrypoints(definition, aggregate.emitAggregate),
    domainTests: renderDomainTests(definition)
  }
}

/** Los módulos cruzados del arrastre y de la denormalización se importan una sola vez. */
function mergeModules(base: DragModule[], extra: DragModule[]): DragModule[] {
  const seen = new Set(base.map(m => m.className))
  return [...base, ...extra.filter(m => !seen.has(m.className) && seen.add(m.className))]
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
        valueTypeName: `${vo.name}Value`,
        // el ancla de la máquina (spec 43) habla en verbos: initial() + factoría y predicado por valor
        ...(definition.state?.field === name && vo.values?.length
          ? {
              stateMachine: {
                initial: definition.state.initial,
                values: vo.values.map(value => ({
                  value,
                  method: names(value).propertyName,
                  predicate: `is${names(value).className}`
                }))
              }
            }
          : {})
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

  const enums = [...new Set(fields.map(([, f]) => f.form?.optionsType).filter((t): t is string => t !== undefined))]
    // el mock solo importa lo que usa como valor: los enums reales (las unions van como literal)
    .filter(t => t.endsWith('Enum'))
    .sort()

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
    // solo los '<X>Enum' son enums REALES (valores); una union como valor no compila al servir
    if (form.optionsType.endsWith('Enum')) {
      return `${form.optionsType}.${option.value.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
    }
    return `'${option.value}'`
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
  | 'formEnumImports'
  | 'formPageLookupProviders'
  | 'needsSelect'
  | 'savedEmitLines'
  | 'formValueBuildLines'
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
    // el estado gobernado por máquina (spec 43) no se edita a mano: solo transiciona
    .filter(([name, f]) => f.form && f.form.control !== 'none' && name !== definition.state?.field)
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
    formEnumImports: [...new Set(enumSelects.map(f => f.optionsType as string))].sort().join(', '),
    formPageLookupProviders: lookups.map(f => {
      const resource = f.lookup?.resource ?? ''
      const service = `${resource.charAt(0).toUpperCase()}${resource.slice(1)}Service`
      return `{ provide: ${service}, useValue: { ${pluralOfResource(resource)}: { value: () => undefined } } }`
    }),
    needsSelect: selects.length > 0,
    savedEmitLines: renderSavedEmit(formFields, lookups),
    formValueBuildLines: renderFormValueBuild(formFields, lookups),
    // la plantilla solo puede leer miembros de la clase: se expone la constante
    formHelperLines: enumSelects
      .filter(f => !f.lookup && f.optionsConst)
      .map(f => `protected readonly ${f.name}Options = ${f.optionsConst}`),
    lookupInjectLines: lookups.map(
      f => `private readonly _${f.lookup?.resource}Service = inject(${cap(f.lookup?.resource ?? '')}Service)`
    ),
    lookupComputedLines: lookups.flatMap(f => [
      `readonly ${pluralOfResource(f.lookup?.resource)} = computed(() => this._${f.lookup?.resource}Service.${pluralOfResource(f.lookup?.resource)}.value()?.items ?? [])`,
      `protected readonly ${f.name}Options = computed<AppSelectOption[]>(() =>`,
      `  this.${pluralOfResource(f.lookup?.resource)}().map(item => ({ value: item.id, label: item.${f.lookup?.labelField} }))`,
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
      `protected readonly ${f.name}ToLabel = (value: unknown): string => this.${pluralOfResource(resource)}().find(item => item.id === value)?.${labelField} ?? ''`
    )
  }
  return lines
}

/** Ajustes de tipo/valor entre el rawValue del form y el FormValue emitido (los comparten diálogo y página). */
function formValueExtras(formFields: FormFieldSubstitution[], lookups: FormFieldSubstitution[]): string[] {
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
        `${f.lookup?.denormalizes}: this.${pluralOfResource(f.lookup?.resource)}().find(item => item.id === raw.${f.name})?.${f.lookup?.labelField} ?? ''`
    )
  const dateNulls = formFields
    .filter(f => f.control === 'date' && !f.required)
    .map(f => `${f.name}: raw.${f.name} || null`)
  return [...casts, ...selectCasts, ...numberCasts, ...lookupFixes, ...denormLines, ...dateNulls]
}

function renderSavedEmit(formFields: FormFieldSubstitution[], lookups: FormFieldSubstitution[]): string[] {
  const extras = formValueExtras(formFields, lookups)
  if (!extras.length) return ['this.saved.emit(raw)']
  return ['this.saved.emit({', `  ...raw,`, ...extras.map(e => `  ${e},`), '})']
}

/** La página-formulario construye el MISMO valor que el diálogo, pero para llamar al service (spec 48). */
function renderFormValueBuild(formFields: FormFieldSubstitution[], lookups: FormFieldSubstitution[]): string[] {
  const extras = formValueExtras(formFields, lookups)
  if (!extras.length) return ['const value = raw']
  return ['const value = {', `  ...raw,`, ...extras.map(e => `  ${e},`), '}']
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
  if (definition.history) types.push('AuditEventDto')
  return types.sort().join(', ')
}

function renderAngularCoreImports(features: { edit: boolean; delete: boolean }): string {
  // `input` siempre: el listado declara `embedded` para poder vivir dentro del panel (spec 52)
  const base = ['ChangeDetectionStrategy', 'Component', 'computed', 'inject', 'input', 'linkedSignal']
  if (features.edit || features.delete) base.push('signal')
  return base.join(', ')
}

function resolveFeatures(definition: ResourceDefinition): {
  view: boolean
  delete: boolean
  edit: boolean
  trash: boolean
  history: boolean
  import: boolean
} {
  const canDelete = definition.list?.features?.delete ?? false
  return {
    view: definition.list?.features?.view ?? true,
    delete: canDelete,
    edit: definition.list?.features?.edit ?? true,
    // la papelera (spec 29) se DERIVA: borrado lógico + listado que borra
    trash: canDelete && wantsSoftDelete(definition),
    // el historial (spec 31): timeline en la ficha
    history: definition.history === true,
    // el import (spec 33): botón y diálogo; exige alta y diálogo de edición
    import: definition.list?.features?.import === true && (definition.formSections?.length ?? 0) > 0
  }
}

/**
 * El comentario de las acciones de fila cuando la entidad tiene ficha. La papelera la manda
 * `features.delete`, no la presencia de ficha: `customers` del canon no borra porque lo gobierna
 * un sincronismo externo (spec 32 de la referencia), y eso lo dice su schema, no la plantilla.
 */
function renderRowActionsComment(features: { delete: boolean }): string[] {
  if (!features.delete) {
    return [
      '  // Editar solo para quien puede escribir: el backend responde 403 al viewer, así que ofrecer la',
      '  // acción solo llevaría a un error.'
    ]
  }
  return [
    '  // Editar y borrar solo para quien puede escribir: el backend responde 403 al viewer, así que',
    '  // ofrecer la acción solo llevaría a un error. La ficha no sustituye a la papelera: si el schema',
    '  // declara la entidad borrable, se borra desde la fila igual que sin ficha.'
  ]
}

/**
 * El `...(this.canWrite() ? … : [])` de las acciones de escritura. Se arma aquí y no en la
 * plantilla porque la FORMA depende del número de acciones: con una sola, el canon castea el
 * elemento; con dos, el array. Emitir siempre la forma de dos ensuciaría el diff de oro.
 */
function renderRowWriteActions(features: { edit: boolean; delete: boolean }, accessDeclared: boolean): string[] {
  const entries: string[] = []
  if (features.edit) entries.push("{ icon: 'lucidePencil', label: 'Editar', action: 'edit' }")
  if (features.delete) {
    entries.push("{ icon: 'lucideTrash2', label: 'Eliminar', action: 'delete', variant: 'ghost' }")
  }
  if (entries.length === 0) return []
  if (accessDeclared) {
    // matriz granular (spec 49): cada acción obedece a SU capacidad, no a un canWrite común
    const guards: string[] = []
    if (features.edit) guards.push(`    ...(this.canEdit() ? [${entries[0]} as TableAction] : [])`)
    if (features.delete) {
      guards.push(`    ...(this.canDelete() ? [${entries[entries.length - 1]} as TableAction] : [])`)
    }
    return guards.map((line, index) => (index < guards.length - 1 ? `${line},` : line))
  }
  if (entries.length === 1) return [`    ...(this.canWrite() ? [${entries[0]} as TableAction] : [])`]
  return [
    '    ...(this.canWrite()',
    '      ? ([',
    ...entries.map((entry, index) => `          ${entry}${index < entries.length - 1 ? ',' : ''}`),
    '        ] as TableAction[])',
    '      : [])'
  ]
}

function renderIcons(features: { view: boolean; delete: boolean; edit: boolean }): string[] {
  const icons: string[] = []
  if (features.view) icons.push('lucideEye')
  if (features.edit) icons.push('lucidePencil')
  if (features.delete) icons.push('lucideTrash2')
  return icons
}

function renderUiStrings(definition: ResourceDefinition, dragsChildren = false): UiStrings {
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
    // El copy dice la VERDAD sobre lo que va a pasar (spec 38): archivar es reversible y
    // arrastra; eliminar es permanente. Aviso genérico, sin conteos previos (decisión 2).
    deleteDescriptionPrefix: wantsSoftDelete(definition)
      ? `Se archivará ${article} ${lowerSingular}`
      : `Se eliminará permanentemente ${article} ${lowerSingular}`,
    deleteDescriptionSuffix: wantsSoftDelete(definition)
      ? `${dragsChildren ? ' y sus registros relacionados' : ''}. Podrás restaurarl${feminine ? 'a' : 'o'} desde la papelera.`
      : ' y todos sus datos asociados. Esta acción no se puede deshacer.',
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
      // Un enum se lee por su ETIQUETA, igual que en el listado: la ficha no puede
      // decir «en_curso» donde la tabla dice «En curso».
      const badges = field?.table?.badgeMap
      const labels = badges
        ? `, labels: { ${Object.entries(badges)
            .map(([value, badge]) => `${objectKey(value)}: '${badge.label}'`)
            .join(', ')} }`
        : ''
      return `{ key: '${name}', label: '${label}'${type ? `, type: '${type}'` : ''}${labels} }`
    })

  return { titleField, rows }
}

/**
 * Galería (spec 17): título = primer texto buscable, subtítulo = siguiente texto,
 * métrica = primer número. Los chips son los dos campos restantes que la tabla
 * muestra — lo justo para que la tarjeta diga algo sin convertirse en una ficha.
 */
/**
 * Las etiquetas salen del PROPIO modelo, por prioridad: badgeMap del listado (cubre los valores
 * que solo siembra el sync), options del formulario y el valor capitalizado como último recurso.
 */
/**
 * Un valor de conjunto cerrado usado como CLAVE de un objeto emitido. `agua` vale tal cual, pero
 * `responsabilidad-civil` necesita comillas: sin ellas Angular no parsea la expresión y se cae la
 * plantilla entera del componente —819 errores de compilación desde una sola línea, defecto
 * cazado por la demo `peritajes` (2026-08-20)—. Se entrecomilla solo lo que lo necesita, así el
 * resto del emitido, y el oro con él, no cambia ni una coma.
 */
/**
 * El campo que el diálogo de borrado entrecomilla («Se archivará el informe "…"»). Era `name` a
 * ciegas, y el emitido no compilaba en cuanto la entidad no tenía ese campo —defecto cazado por
 * la demo `peritajes` (2026-08-20); los cuatro modelos de oro lo tapaban porque todos tienen
 * `name` o lo declaran a mano—.
 *
 * El orden de preferencia es el mismo criterio con el que la ficha elige su título: por lo que
 * el usuario reconoce la entidad. Y termina en `id`, que existe siempre: mejor enseñar un uuid
 * que emitir código que no compila.
 */
function pickDeleteLabelField(definition: ResourceDefinition): string {
  const declared = definition.list?.deleteLabelField
  if (declared) return declared

  const fields = Object.entries(definition.fields)
  const has = (name: string): boolean => fields.some(([field]) => field === name)
  if (has('name')) return 'name'

  const searchableText = fields.find(([, f]) => f.type === 'string' && f.query?.searchable)?.[0]
  const anyText = fields.find(([name, f]) => f.type === 'string' && name !== 'id')?.[0]
  return searchableText ?? anyText ?? 'id'
}

function objectKey(value: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value) ? value : `'${value}'`
}

function renderLabelsModule(definition: ResourceDefinition): LabelsModuleSubstitution | null {
  if (!definition.labelsModule) return null

  const consts = new Map<string, { name: string; enumName: string; entries: { memberKey: string; label: string }[] }>()

  for (const field of Object.values(definition.fields)) {
    const constName = field.form?.labelsConst ?? field.table?.valueMapConst
    const enumName = field.form?.optionsType
    const values = typeof field.vo === 'object' ? (field.vo.values ?? []) : []
    if (!constName || !enumName || !values.length || consts.has(constName)) continue

    const entries = values.map(value => ({
      memberKey: value.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      label:
        field.table?.badgeMap?.[value]?.label ??
        field.form?.options?.find(option => option.value === value)?.label ??
        value.charAt(0).toUpperCase() + value.slice(1)
    }))
    consts.set(constName, { name: constName, enumName, entries })
  }

  if (!consts.size) return null

  return {
    enumImports: [...new Set([...consts.values()].map(c => c.enumName))].sort(),
    consts: [...consts.values()]
  }
}

/** Las columnas del import son las del alta (mismo filtro que el RegisterInput), con su tipo. */
function renderImportCsv(definition: ResourceDefinition): ImportSubstitution | null {
  if (!(definition.list?.features?.import === true && (definition.formSections?.length ?? 0) > 0)) return null

  const columns = Object.entries(definition.fields)
    .filter(([name, f]) => name !== 'id' && !f.syncManaged && !(f.optionalPrimitive && !f.updatable))
    .map(([name, f]) => ({
      name,
      kind:
        f.type === 'number' || f.type === 'integer'
          ? ('number' as const)
          : f.type === 'boolean'
            ? ('boolean' as const)
            : f.type === 'date' || f.type === 'timestamptz'
              ? ('date' as const)
              : ('text' as const)
    }))

  return { columns }
}

function renderGantt(definition: ResourceDefinition): GanttSubstitution | null {
  const { gantt, period } = definition
  if (!gantt || !period) return null

  const fields = Object.entries(definition.fields).filter(([, f]) => !f.pk)
  const texts = fields.filter(([, f]) => f.type === 'string' || f.type === 'text')
  const titleField = gantt.title ?? texts.find(([, f]) => f.query?.searchable)?.[0] ?? texts[0]?.[0] ?? fields[0][0]

  return { titleField, startField: period.start, endField: period.end }
}

function renderCalendar(definition: ResourceDefinition): CalendarSubstitution | null {
  const { calendar } = definition
  if (!calendar) return null

  const fields = Object.entries(definition.fields).filter(([, f]) => !f.pk)
  const texts = fields.filter(([, f]) => f.type === 'string' || f.type === 'text')
  const labelField = calendar.label ?? texts.find(([, f]) => f.query?.searchable)?.[0] ?? texts[0]?.[0] ?? fields[0][0]

  const dateField = definition.fields[calendar.date]
  const dateLabel = dateField?.table?.label ?? dateField?.form?.label ?? calendar.date

  const colorVo = calendar.color ? definition.fields[calendar.color]?.vo : undefined
  const values = typeof colorVo === 'object' ? (colorVo.values ?? []) : []
  const labelOf = (value: string): string =>
    definition.fields[calendar.color ?? '']?.table?.badgeMap?.[value]?.label ??
    definition.fields[calendar.color ?? '']?.form?.options?.find(o => o.value === value)?.label ??
    value.charAt(0).toUpperCase() + value.slice(1)

  const weekends = calendar.weekends ?? true
  const dayNames = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].slice(0, weekends ? 7 : 5)

  return {
    dateField: calendar.date,
    labelField,
    dateLabel,
    colorField: calendar.color ?? null,
    legend: values.map((value, colorIndex) => ({ value, label: labelOf(value), colorIndex })),
    weekends,
    dayNames
  }
}

function renderGallery(definition: ResourceDefinition): GallerySubstitution | null {
  const { gallery } = definition
  if (!gallery) return null

  const fields = Object.entries(definition.fields).filter(([, f]) => !f.pk)
  const texts = fields.filter(([, f]) => f.type === 'string' || f.type === 'text')
  // el decimal manda sobre el entero: en una tarjeta el importe pesa más que
  // una duración o un contador
  const numbers = [...fields.filter(([, f]) => f.type === 'number'), ...fields.filter(([, f]) => f.type === 'integer')]

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
        .map(([name, field]) => {
          const label = field.table?.label ?? name
          // Un conjunto cerrado se lee con SUS etiquetas, como en el listado: 'badge' es un tipo
          // del DataTable y el contrato de RelatedColumn no lo admite — emitirlo no compilaba
          // (defecto cazado por la demo Solaris, 2026-08-10).
          if (field.table?.type === 'badge' && field.table.badgeMap) {
            const labels = Object.entries(field.table.badgeMap)
              .map(([value, badge]) => `${objectKey(value)}: '${badge.label}'`)
              .join(', ')
            return `{ key: '${name}', label: '${label}', labels: { ${labels} } }`
          }
          // la columna viaja con su tipo o la tabla enseña la fecha en ISO crudo (defecto 21):
          // key/label no bastan para que formatValue sepa qué está leyendo
          const rawType = field.table?.type ?? detailValueType(field) ?? (field.type === 'date' ? 'date' : null)
          const type = rawType === 'badge' ? null : rawType
          return `{ key: '${name}', label: '${label}'${type ? `, type: '${type}'` : ''} }`
        })

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

/**
 * Techo de las columnas de texto largo (spec 54). El lienzo replica este número en
 * `canvas-table.component.ts` del estudio, que no puede importar de aquí.
 */
const LONG_TEXT_MAX_WIDTH = 280

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
        // un campo que se edita en textarea es de 2000 caracteres: su columna se corta (spec 54).
        // `...table` va después, así que un techo declarado en el modelo gana a la política.
        ...(field?.form?.control === 'textarea' ? { maxWidth: LONG_TEXT_MAX_WIDTH } : {}),
        ...table
      })
    )
}

/** Plural REAL del recurso apuntado por un lookup: del registro, nunca «+s». */
function pluralOfResource(resource: string | undefined): string {
  if (!resource) return ''
  return MODELS[resource]?.plural ?? `${resource}s`
}

function renderFrontendColumn(name: string, table: FieldTable): string {
  const parts = [`key: '${name}'`, `label: '${table.label}'`]
  if (table.filterable) parts.push('filterable: true')
  if (table.sortable === false) parts.push('sortable: false')
  if (table.type === 'date' || table.type === 'number' || table.type === 'boolean') {
    parts.push(`type: '${table.type}'`)
  }
  if (table.minWidth !== undefined) parts.push(`minWidth: ${table.minWidth}`)
  if (table.maxWidth !== undefined) parts.push(`maxWidth: ${table.maxWidth}`)
  if (table.valueMapConst) parts.push(`valueMap: ${table.valueMapConst}`)
  if (table.type === 'badge' && table.badgeMap) {
    parts.push(`type: 'badge'`)
    const entries = Object.entries(table.badgeMap)
      .map(([key, badge]) => `      ${objectKey(key)}: { label: '${badge.label}', variant: '${badge.variant}' }`)
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
  if (wantsSoftDelete(definition)) imports.push('DeleteDateColumn')
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
