import { Transform } from 'class-transformer'
import { IsIn, IsOptional } from 'class-validator'
import { EXPORT_FORMATS, ExportFormat } from '@sap-licenses/shared/domain'
import { PaginateOffsetDto } from '../../../../../../shared/infrastructure/dtos/paginate-offset.dto'

const HEALTH_VALUES = ['healthy', 'underused', 'overused', 'contractual_breach']

// Extends PaginateOffsetDto because ParseCriteriaPipe always emits page/pageSize and the global
// ValidationPipe runs with forbidNonWhitelisted. The export use case ignores page/pageSize (it never paginates).
export class ExportLicensesQueryDto extends PaginateOffsetDto {
  @IsIn(EXPORT_FORMATS)
  format!: ExportFormat

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]))
  @IsIn(HEALTH_VALUES, { each: true })
  health?: string[]
}
