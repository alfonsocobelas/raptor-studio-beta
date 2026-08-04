import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { MAX_ATTACHMENT_SIZE_BYTES } from '../../../../../shared/domain/storage/attachment-constants'
import { ParseUUIDv7Pipe } from '../../../../../shared/infrastructure/pipes/parse-uuid-v7.pipe'
import { ProjectAttachmentDto, ProjectAttachmentsService } from './project-attachments.service'

/** Adjuntos de Proyectos: subir, listar, descargar y borrar. */
@Controller('projects/:projectId/attachments')
export class ProjectAttachmentsController {
  constructor(private readonly attachments: ProjectAttachmentsService) {}

  @Get()
  list(@Param('projectId', ParseUUIDv7Pipe) projectId: string): Promise<ProjectAttachmentDto[]> {
    return this.attachments.list(projectId)
  }

  // Tope de tamaño en multer antes de que el buffer llegue a memoria; el servicio
  // revalida tamaño y MIME antes de tocar el almacenamiento.
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES } }))
  upload(
    @Param('projectId', ParseUUIDv7Pipe) projectId: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
  ): Promise<ProjectAttachmentDto> {
    return this.attachments.upload(projectId, {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size
    })
  }

  @Get(':id/download')
  async download(
    @Param('projectId', ParseUUIDv7Pipe) projectId: string,
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<StreamableFile> {
    const { buffer, fileName, mimeType } = await this.attachments.download(projectId, id)
    return new StreamableFile(buffer, { type: mimeType, disposition: `attachment; filename="${fileName}"` })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('projectId', ParseUUIDv7Pipe) projectId: string,
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<void> {
    return this.attachments.remove(projectId, id)
  }
}
