// Canonical resource-schema format (spec 01). Single contract of the accelerator:
// backend and frontend are both generated from a ResourceDefinition.
// Pure TypeScript on purpose — this lib knows nothing about frameworks or tooling.

export type FieldType = 'uuid' | 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'timestamptz' | 'text'

/** Decision 2 (2026-07-30): origin governs the sync ONLY, never form editability. */
export type FieldOrigin = 'auto' | 'sap' | 'manual'

export type FormControl = 'text' | 'textarea' | 'number' | 'checkbox' | 'date' | 'select' | 'none'

export interface VoDefinition {
  /** Class name (decision 5: explicit) */
  name: string
  /** Human field name used in messages and fieldName ('CMS case ID') */
  fieldName: string
  /** String base guard: ensureIsDefined (default) or ensureIsString */
  ensure?: 'defined' | 'string'
  noInnerWhitespace?: boolean
  /** Length rule against the constraints key: 'max' (…must be at most N characters) or 'exact' */
  lengthRule?: 'max' | 'exact'
  /** Also emit the string MIN-length check against the constraints key */
  minLength?: boolean
  /** Email format check (regex) after the length rule */
  email?: boolean
  /** Custom message for the exact-length rule (e.g. '…must be a N-letter ISO code') */
  lengthMessage?: string
  /** Key inside <CONST>_CONSTRAINTS; defaults to the SNAKE_CASE field name */
  constraintKey?: string
  /** Numeric/integer: emit the MIN check against the constraints key */
  min?: boolean
  /** Emit `static unset(): Nullable<X> { return null }` */
  unset?: boolean
  /** Enum kind: allowed values (emits <Name>Value union + VALUES) */
  values?: string[]
}

export interface FieldLookup {
  /** Resource whose service provides the options (e.g. 'customer' → CustomerService) */
  resource: string
  /** Field of the looked-up item shown as label (e.g. 'name') */
  labelField: string
  /** FormValue field filled from the chosen item's labelField at save (e.g. 'customerName') */
  denormalizes?: string
}

export type RelationKind = 'reference' | 'composition'

export interface FieldRelation {
  to: string
  context?: string
  /** Decision 3: parent drill-downs are DERIVED from these child references, never duplicated. */
  kind: RelationKind
}

/**
 * Query flags. A number fixes the position in the emitted ALLOWED_* lists
 * (golden modules do not follow field order); `true` appends in field order.
 */
export interface FieldQuery {
  sortable?: boolean | number
  filterable?: boolean | number
  searchable?: boolean | number
  /** Comment lines emitted above this entry in the ALLOWED_FILTERS list */
  filterNote?: string[]
}

export interface BadgeEntry {
  label: string
  variant: string
}

export interface FieldTable {
  show: boolean
  /** Position in the emitted columns[] (UI order differs from field order in the golden modules) */
  order?: number
  label?: string
  minWidth?: number
  /** UI truth of the DataTable (independent of backend query flags, as in the golden modules) */
  filterable?: boolean
  sortable?: false
  type?: 'badge' | 'date' | 'number'
  badgeMap?: Record<string, BadgeEntry>
  /** Name of a labels const (from <name>-labels.ts) rendered as valueMap */
  valueMapConst?: string
}

export interface SelectOption {
  value: string
  label: string
}

export interface FieldForm {
  /** Decision 4: 'none' means the generator omits the control (e.g. relation without lookup endpoint). */
  control: FormControl
  label?: string
  rows?: number
  /** Position inside its form section (form order differs from field order in the golden modules) */
  order?: number
  /** Section id (declared in resource.formSections) */
  section?: string
  /** DOM id of the control; defaults to the field name (golden modules use short hand-picked ids) */
  id?: string
  /** Select choices */
  options?: SelectOption[]
  /** Shared-domain type of the select value (e.g. 'CustomerClassification'); imported and used in the FormValue */
  optionsType?: string
  /** Default value expression for the reactive control (e.g. 'ContractTypeEnum.CLOUD'); '' when absent */
  default?: string
  /** Group-validator error shown under this control with forceShow (e.g. dateRange end field) */
  groupErrorMessage?: string
  /** Emits Validators.maxLength (explicit: the golden modules apply it inconsistently) */
  maxLength?: number
  /** Field spans the full grid width (sm:col-span-2) */
  fullWidth?: boolean
  /** Dynamic select fed by another resource's service (realizes decision 4) */
  lookup?: FieldLookup
  /** Const of labels imported from <fileName>-labels instead of inlined in the dialog */
  labelsConst?: string
  placeholder?: string
}

/** Persistence-level detail required for golden-diff fidelity (proven in spec 00). */
export interface ColumnDefinition {
  /** TypeORM column type: 'varchar' | 'uuid' | 'numeric' | 'timestamptz' | ... */
  type: string
  length?: number
  /** Length taken from the domain constraints constant: 'CONTRACT_NUMBER.MAX' → LIMITS.CONTRACT_NUMBER.MAX */
  lengthConst?: string
  default?: string | number | boolean
  /** Raw SQL default emitted as () => "..." */
  defaultRaw?: string
  precision?: number
  scale?: number
  array?: boolean
  transformer?: 'numeric' | 'nullableNumeric'
  /** Override of the emitted TS type (e.g. 'Nullable<string>'); derived from `type` otherwise */
  tsType?: string
}

export interface FieldDefinition {
  type: FieldType
  origin?: FieldOrigin
  pk?: boolean
  required?: boolean
  nullable?: boolean
  /** Decision 1: on optional fields uniqueness applies only when a value is present (ifPresent). */
  unique?: boolean
  /** Decision 5: VO names are explicit, never derived. Object form drives VO file emission. */
  vo?: string | VoDefinition
  /** VO shared across the context (not emitted): { name: 'CustomerName' } imported from context-shared */
  voShared?: { name: string; unset?: boolean }
  /** Reuse another field's module VO by name (type-only reference, no emission) */
  voRef?: { name: string; unset?: boolean }
  /** Lifecycle field governed by the sync: optional in primitives, excluded from update/register */
  syncManaged?: boolean
  min?: number
  max?: number
  relation?: FieldRelation
  /** Field is optional in domain primitives (late additions): mapper emits ?? <default|null> */
  optionalPrimitive?: boolean
  /** optionalPrimitive fields default to non-updatable (sync-populated); set true for user-editable ones */
  updatable?: boolean
  query?: FieldQuery
  table?: FieldTable
  form?: FieldForm
  column?: ColumnDefinition
  /** Comment lines emitted verbatim above the persisted column */
  comment?: string[]
}

export interface ListAction {
  id: string
  icon: string
  label: string
  navigate?: string
  opens?: string
  confirm?: boolean
  variant?: string
}

export interface ListDefinition {
  /** Label of the view action; defaults to 'Ver ficha' */
  viewLabel?: string
  /** Field shown in the delete confirmation text; defaults to 'name' */
  deleteLabelField?: string
  /** Display-only columns whose keys are not entity fields (derived/enriched values) */
  virtualColumns?: Record<string, FieldTable>
  defaultSort?: { field: string; dir: 'asc' | 'desc' }
  pageSize?: number
  features?: {
    create?: boolean
    export?: ('csv' | 'xlsx')[]
    search?: boolean
    /** Row action navigating to the detail route (default true; Router only imported when true) */
    view?: boolean
    /** Delete flow with confirmation alert-dialog (default false) */
    delete?: boolean
    /** Create/edit dialog machinery (default true; false = read-only list) */
    edit?: boolean
  }
  actions?: ListAction[]
}

export interface RelationDefinition {
  kind: 'composition' | 'inbound'
  of?: string
  from?: string
  by?: string
  in?: string
  drilldown?: boolean
}

export interface DetailDefinition {
  title: string
  sections: string[]
}

export type ConstraintValue = { shared: true | string } | number | { [key: string]: number | Record<string, number> }

export interface ResourceLabels {
  singular: string
  plural: string
  subtitle?: string
  /** Grammatical gender of the singular, to derive UI strings (Nuevo/Nueva, el/la, creado/a) */
  gender?: 'm' | 'f'
}

export interface ResourceDefinition {
  /** Schema format version — bump only with a migration note (revision improvement) */
  schemaVersion: 1
  name: string
  plural: string
  /** Bounded context / Nest module */
  context: string
  /** PostgreSQL schema (schema-per-context rule) */
  schemaName: string
  route?: string
  api?: string
  /** Import alias of the app's shared domain lib in emitted frontend code */
  sharedDomainAlias?: string
  /** DTO type name in emitted frontend code; defaults to <ClassName>Dto */
  dtoName?: string
  /** Dialog form sections, in emission order */
  formSections?: { id: string; title: string }[]
  /** Group-level validators the dialog attaches (known set: 'dateRange') */
  formGroupValidators?: { kind: 'dateRange'; startField: string; endField: string }[]
  /** Aggregate composes these two date fields into a shared Period VO */
  period?: { start: string; end: string }
  /**
   * Child entity composition (B3): owned children with cascade inside the aggregate.
   * parentField is the child's FK to the aggregate; maxConst caps children via the
   * constraints table; primaryFlag derives the one-primary-among-children semantics.
   */
  composition?: {
    name: string
    plural: string
    parentField: string
    maxConst?: string
    primaryFlag?: string
    fields: Record<string, FieldDefinition>
  }
  /** Labels module imported by the dialog (<fileName>-labels); when set, label consts are not inlined */
  labelsModule?: boolean
  labels?: ResourceLabels
  /** Domain constraints constant imported as LIMITS (e.g. 'CONTRACT_CONSTRAINTS') */
  constraintsConst?: string
  /** Emit createdAt/updatedAt audit columns */
  audit?: boolean
  /** Emit the '// --- AUDIT FIELDS --- //' marker above the audit columns (C2: not uniform across golden modules) */
  auditComment?: boolean
  /** Comment lines emitted above SEARCHABLE_FIELDS in the search-config */
  searchNotes?: string[]
  /** Files NOT to emit for this resource (C2: golden modules carry hand extensions the canon does not cover) */
  skipEmit?: ('mapper' | 'constants' | 'frontendList')[]
  /** Emit a DeleteDateColumn soft-delete column (deletedAt) */
  softDelete?: boolean
  /** Comment lines emitted above ALLOWED_ORDERS in the search-config */
  ordersNotes?: string[]
  /** Additional exported constant groups in <name>-constants.ts (e.g. OBSERVABILITY_THRESHOLDS) */
  extraConstants?: Record<string, Record<string, number>>
  /**
   * Feeds <name>-constants.ts. Values: { shared: true } references SHARED_CONSTRAINTS.<KEY>,
   * { shared: '<OTHER_KEY>' } references a differently-named shared entry, a number emits a
   * scalar, and plain objects emit (possibly nested) literal groups.
   */
  constraints?: Record<string, ConstraintValue>
  /** Keyed by field name (decision A4); key insertion order is the emission order */
  fields: Record<string, FieldDefinition>
  list?: ListDefinition
  relations?: Record<string, RelationDefinition>
  detail?: DetailDefinition
}
