import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { v7 as uuidv7 } from 'uuid'
import { FileStoragePort } from '../../../../../shared/domain/storage/file-storage.port'
import { AttachmentFileName } from '../../../../../shared/domain/storage/value-objects/attachment-file-name.vo'
import { AttachmentMimeType } from '../../../../../shared/domain/storage/value-objects/attachment-mime-type.vo'
import { AttachmentSizeBytes } from '../../../../../shared/domain/storage/value-objects/attachment-size-bytes.vo'
import { TypeOrmProjectAttachmentEntity } from './project-attachment.entity'

export interface ProjectAttachmentDto {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  uploadedAt: string
}

export interface UploadedProjectFile {
  buffer: Buffer
  originalName: string
  mimeType: string
  sizeBytes: number
}

/**
 * Adjuntos de Proyectos: metadatos en tabla propia, binario en el puerto de
 * almacenamiento. El storageKey lo genera SIEMPRE el backend (uuidv7), nunca el cliente.
 */
@Injectable()
export class ProjectAttachmentsService {
  constructor(
    @InjectRepository(TypeOrmProjectAttachmentEntity)
    private readonly repository: Repository<TypeOrmProjectAttachmentEntity>,
    private readonly fileStorage: FileStoragePort
  ) {}

  async list(projectId: string): Promise<ProjectAttachmentDto[]> {
    const rows = await this.repository.find({ where: { projectId }, order: { uploadedAt: 'DESC' } })
    return rows.map(row => this.toDto(row))
  }

  async upload(projectId: string, file: UploadedProjectFile): Promise<ProjectAttachmentDto> {
    // Las reglas de fichero son de DOMINIO: los VOs validan nombre, tipo y tamaño antes de
    // tocar el almacenamiento, y el filtro global traduce su error al status HTTP.
    const fileName = AttachmentFileName.create(file.originalName)
    const mimeType = AttachmentMimeType.create(file.mimeType)
    const sizeBytes = AttachmentSizeBytes.create(file.sizeBytes)

    const storageKey = uuidv7()
    await this.fileStorage.upload(storageKey, file.buffer, mimeType.value)

    // Si falla el guardado de metadatos se borra el binario: un blob huérfano es
    // inofensivo, una fila apuntando a un blob inexistente no.
    try {
      const row = await this.repository.save(
        this.repository.create({
          id: uuidv7(),
          projectId,
          fileName: fileName.value,
          mimeType: mimeType.value,
          sizeBytes: sizeBytes.value,
          storageKey
        })
      )
      return this.toDto(row)
    } catch (error) {
      await this.fileStorage.delete(storageKey).catch(() => undefined)
      throw error
    }
  }

  async download(projectId: string, id: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const row = await this.findOrThrow(projectId, id)
    return { buffer: await this.fileStorage.download(row.storageKey), fileName: row.fileName, mimeType: row.mimeType }
  }

  async remove(projectId: string, id: string): Promise<void> {
    const row = await this.findOrThrow(projectId, id)
    await this.repository.delete({ id })
    await this.fileStorage.delete(row.storageKey).catch(() => undefined)
  }

  // El id del registro entra en el WHERE: pedir el adjunto de otro registro es un 404,
  // no una fuga.
  private async findOrThrow(projectId: string, id: string): Promise<TypeOrmProjectAttachmentEntity> {
    const row = await this.repository.findOne({ where: { id, projectId } })
    if (!row) {
      throw new NotFoundException(`Adjunto ${id} no encontrado`)
    }
    return row
  }

  private toDto(row: TypeOrmProjectAttachmentEntity): ProjectAttachmentDto {
    return {
      id: row.id,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      uploadedAt: row.uploadedAt.toISOString()
    }
  }
}
