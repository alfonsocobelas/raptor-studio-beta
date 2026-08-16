import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { PuntoRepository } from '../../domain/punto-repository'
import { PuntoPrimitiveProps } from '../../domain/punto-types'
import searchPuntoConfig from '../config/search-punto-config'

@Injectable()
export class ExportPuntosUseCase {
  constructor(
    private readonly puntoRepository: PuntoRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<PuntoPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchPuntoConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.puntoRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const puntos = await this.puntoRepository.matching(criteria)
    return puntos.map(punto => punto.toPrimitives())
  }
}
