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
import { MuestraAttachmentDto, MuestraAttachmentsService } from './muestra-attachments.service'

/** Adjuntos de Muestras: subir, listar, descargar y borrar. */
@Controller('muestras/:muestraId/attachments')
export class MuestraAttachmentsController {
  constructor(private readonly attachments: MuestraAttachmentsService) {}

  @Get()
  list(@Param('muestraId', ParseUUIDv7Pipe) muestraId: string): Promise<MuestraAttachmentDto[]> {
    return this.attachments.list(muestraId)
  }

  // Tope de tamaño en multer antes de que el buffer llegue a memoria; el servicio
  // revalida tamaño y MIME antes de tocar el almacenamiento.
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_ATTACHMENT_SIZE_BYTES } }))
  upload(
    @Param('muestraId', ParseUUIDv7Pipe) muestraId: string,
    @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
  ): Promise<MuestraAttachmentDto> {
    return this.attachments.upload(muestraId, {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size
    })
  }

  @Get(':id/download')
  async download(
    @Param('muestraId', ParseUUIDv7Pipe) muestraId: string,
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<StreamableFile> {
    const { buffer, fileName, mimeType } = await this.attachments.download(muestraId, id)
    return new StreamableFile(buffer, { type: mimeType, disposition: `attachment; filename="${fileName}"` })
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('muestraId', ParseUUIDv7Pipe) muestraId: string,
    @Param('id', ParseUUIDv7Pipe) id: string
  ): Promise<void> {
    return this.attachments.remove(muestraId, id)
  }
}
