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
import { PropiedadAttachmentDto, PropiedadAttachmentsService } from './propiedad-attachments.service'

/** Adjuntos de Propiedades: subir, listar, descargar y borrar. */
@Controller('propiedades/:propiedadId/attachments')
export class PropiedadAttachmentsController {
  constructor(private readonly attachments: PropiedadAttachmentsService) {}

  @Get()
  list(@Param('propiedadId', ParseUUIDv7Pipe) propiedadId: string): Promise<PropiedadAttachmentDto[]> {
    return this.attachments.list(propiedadId)
  }

  // Tope de tamaño en multer antes de que el buffer llegue a memoria; el servicio
  // revalida tamaño y MIME antes de tocar el almacenamiento.
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES } }))
  upload(
    @Param('propiedadId', ParseUUIDv7Pipe) propiedadId: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
  ): Promise<PropiedadAttachmentDto> {
    return this.attachments.upload(propiedadId, {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size
    })
  }

  @Get(':id/download')
  async download(
    @Param('propiedadId', ParseUUIDv7Pipe) propiedadId: string,
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<StreamableFile> {
    const { buffer, fileName, mimeType } = await this.attachments.download(propiedadId, id)
    return new StreamableFile(buffer, { type: mimeType, disposition: `attachment; filename="${fileName}"` })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('propiedadId', ParseUUIDv7Pipe) propiedadId: string,
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<void> {
    return this.attachments.remove(propiedadId, id)
  }
}
