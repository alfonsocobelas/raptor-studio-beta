// Canonical resource-schema format (spec 01). Single contract of the accelerator:
// backend and frontend are both generated from a ResourceDefinition.
// Pure TypeScript on purpose — this lib knows nothing about frameworks or tooling.

export type FieldType = 'uuid' | 'string' | 'number' | 'integer' | 'boolean' | 'date' | 'timestamptz' | 'text'

/** Decision 2 (2026-07-30): origin governs the sync ONLY, never form editability. */
export type FieldOrigin = 'auto' | 'sap' | 'manual'

export type FormControl = 'text' | 'textarea' | 'number' | 'checkbox' | 'date' | 'select' | 'none'

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
  type?: 'badge'
  badgeMap?: Record<string, BadgeEntry>
}

export interface FieldForm {
  /** Decision 4: 'none' means the generator omits the control (e.g. relation without lookup endpoint). */
  control: FormControl
  label?: string
  rows?: number
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
  /** Decision 5: VO names are explicit, never derived. */
  vo?: string
  min?: number
  max?: number
  relation?: FieldRelation
  /** Field is optional in domain primitives (late additions): mapper emits ?? <default|null> */
  optionalPrimitive?: boolean
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
  defaultSort?: { field: string; dir: 'asc' | 'desc' }
  pageSize?: number
  features?: { create?: boolean; export?: ('csv' | 'xlsx')[]; search?: boolean }
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
