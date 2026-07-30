export interface ArchiveAbsentCustomersInput {
  /** sapIds vistos en el run que dispara el archivado */
  seenSapIds: string[]
  /** fecha del run (ISO) que se registra como archivedAt */
  archivedAt: string
}

export interface ArchiveAbsentCustomersOutput {
  archived: number
}
