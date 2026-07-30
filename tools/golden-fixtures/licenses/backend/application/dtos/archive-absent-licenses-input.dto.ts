export interface ArchiveAbsentLicensesInput {
  /** claves (contractNumber#materialId) de materiales vistos en el run que dispara el archivado */
  seenKeys: string[]
  /** fecha del run (ISO) que se registra como archivedAt */
  archivedAt: string
}

export interface ArchiveAbsentLicensesOutput {
  archived: number
}
