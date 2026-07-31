import { Type } from 'class-transformer'
import { Allow, IsInt, Max, Min } from 'class-validator'

export class PaginateOffsetDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1

  @Allow()
  filters?: Array<Map<string, string>>

  @Allow()
  orders?: Array<Map<string, string>>

  // Free-text global search; normalized (trim, non-string dropped) by ParseCriteriaPipe and
  // length-validated by the GlobalSearch VO, so @Allow (whitelist only) is enough here.
  @Allow()
  search?: string

  // Toggle de lifecycle (spec 32); solo lo lee el search de customers vía @Query('includeArchived').
  // @Allow para que forbidNonWhitelisted no rechace el query param; el controller lo interpreta.
  @Allow()
  includeArchived?: string
}
