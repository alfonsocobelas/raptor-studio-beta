export interface ArchiveAbsentContractsInput {
  /** claves vistas en el run (contractNumber para cloud/onprem/mixed, cmsCaseId para maintenance) */
  seenKeys: string[]
  /** fecha del run (ISO) que se registra como archivedAt */
  archivedAt: string
}

export interface ArchiveAbsentContractsOutput {
  archived: number
}
