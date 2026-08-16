import { Injectable, Optional } from '@nestjs/common'
import { Criteria, UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ExportTooLargeError } from '../../../../../shared/domain/errors'
import { EXPORT_ROW_LIMIT } from '../../../../../shared/infrastructure/export/export-limit'
import { ParametroRepository } from '../../domain/parametro-repository'
import { ParametroPrimitiveProps } from '../../domain/parametro-types'
import searchParametroConfig from '../config/search-parametro-config'

@Injectable()
export class ExportParametrosUseCase {
  constructor(
    private readonly parametroRepository: ParametroRepository,
    @Optional() private readonly rowLimit: number = EXPORT_ROW_LIMIT
  ) {}

  async invoke(input: UnpaginatedInput): Promise<ParametroPrimitiveProps[]> {
    const { allowedFilters, allowedOrders, searchableFields } = searchParametroConfig
    const criteria = Criteria.fromUnpaginated(
      input,
      allowedFilters as string[],
      allowedOrders as string[],
      searchableFields as string[]
    )

    const total = await this.parametroRepository.count(criteria)
    if (total > this.rowLimit) {
      throw new ExportTooLargeError(total, this.rowLimit)
    }

    const parametros = await this.parametroRepository.matching(criteria)
    return parametros.map(parametro => parametro.toPrimitives())
  }
}
