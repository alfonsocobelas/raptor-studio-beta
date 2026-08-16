import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm'

/** Metadatos de un adjunto de Muestras. El binario vive en FileStoragePort. */
@Entity({ name: 'muestras_attachments', schema: 'aguas' })
export class TypeOrmMuestraAttachmentEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string

  /** Registro al que pertenece el adjunto: los ficheros son DEL registro, no del recurso. */
  @Index()
  @Column({ name: 'muestra_id', type: 'uuid' })
  muestraId!: string

  @Index()
  @Column({ name: 'file_name', type: 'varchar', length: 255 })
  fileName!: string

  @Column({ name: 'mime_type', type: 'varchar', length: 128 })
  mimeType!: string

  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes!: number

  @Column({ name: 'storage_key', type: 'uuid' })
  storageKey!: string

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date
}
