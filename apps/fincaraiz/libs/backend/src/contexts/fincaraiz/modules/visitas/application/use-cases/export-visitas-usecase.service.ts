import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { VisitaRepository } from '../../domain/visita-repository'
import { VisitaPrimitiveProps } from '../../domain/visita-types'
import searchVisitaConfig from '../config/search-visita-config'

@Injectable()
export class ExportVisitasUseCase {
  constructor(
    private readonly visitaRepository: VisitaRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<VisitaPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchVisitaConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.visitaRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const visitas = await this.visitaRepository.matching(criteria)
    return visitas.map(visita => visita.toPrimitives())
  }
}
