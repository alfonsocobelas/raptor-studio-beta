export interface ArchiveAbsentProjectsInput {
  /** sapProjectIds vistos en el run que dispara el archivado */
  seenKeys: string[]
  /** fecha del run (ISO) que se registra como archivedAt */
  archivedAt: string
}

export interface ArchiveAbsentProjectsOutput {
  archived: number
}
