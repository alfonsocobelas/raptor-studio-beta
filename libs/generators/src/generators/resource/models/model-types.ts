// Minimal resource-schema shape for spec 00 (entity-only scope).
// Provisional location: spec 01 formalizes this contract in libs/schema (@acc/schema).

export interface FieldColumnOptions {
  /** Literal length: emitted as { length: 20 } */
  length?: number
  /** Length taken from the domain constraints constant: 'CONTRACT_NUMBER.MAX' → LIMITS.CONTRACT_NUMBER.MAX */
  lengthConst?: string
  /** Literal default value (string | number | boolean) */
  default?: string | number | boolean
  /** Raw SQL default emitted as () => "..." (e.g. "'{}'" for empty array) */
  defaultRaw?: string
  nullable?: boolean
  array?: boolean
  precision?: number
  scale?: number
  /** Numeric transformers of the reference codebase (see typeorm-contract.entity.ts) */
  transformer?: 'numeric' | 'nullableNumeric'
}

export interface ResourceField {
  name: string
  /** Emitted TS type, e.g. 'string', 'Nullable<string>', 'string[]', 'Date' */
  tsType: string
  /** TypeORM column type, e.g. 'varchar', 'uuid', 'numeric', 'timestamptz' */
  column: string
  pk?: boolean
  /** Comment lines emitted verbatim above the column (reference code carries per-field docs) */
  comment?: string[]
  options?: FieldColumnOptions
}

export interface ResourceModel {
  name: string
  plural: string
  context: string
  /** PostgreSQL schema of the bounded context (schema-per-context rule) */
  schemaName: string
  /** Domain constraints constant imported as LIMITS (e.g. 'CONTRACT_CONSTRAINTS') */
  constraintsConst?: string
  /** Emit createdAt/updatedAt audit columns */
  audit?: boolean
  fields: ResourceField[]
}
