import { IsIn } from 'class-validator'
import { EXPORT_FORMATS, ExportFormat } from '@app/shared/domain'
import { PaginateOffsetDto } from '../../../../../../shared/infrastructure/dtos/paginate-offset.dto'

// Extends PaginateOffsetDto because ParseCriteriaPipe always emits page/pageSize under the global
// forbidNonWhitelisted ValidationPipe. The export use case ignores them (it never paginates).
export class ExportSalesQueryDto extends PaginateOffsetDto {
  @IsIn(EXPORT_FORMATS)
  format!: ExportFormat
}
