import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { MuestraRepository } from '../../domain/muestra-repository'
import { MuestraPrimitiveProps } from '../../domain/muestra-types'
import searchMuestraConfig from '../config/search-muestra-config'

@Injectable()
export class ExportMuestrasUseCase {
  constructor(
    private readonly muestraRepository: MuestraRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<MuestraPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchMuestraConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.muestraRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const muestras = await this.muestraRepository.matching(criteria)
    return muestras.map(muestra => muestra.toPrimitives())
  }
}
