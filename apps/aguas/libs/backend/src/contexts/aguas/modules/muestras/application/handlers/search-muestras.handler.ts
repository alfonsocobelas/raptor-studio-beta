import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { MuestraPrimitiveProps } from '../../domain/muestra-types'
import { SearchMuestrasUseCase } from '../use-cases/search-muestras-usecase.service'

@Injectable()
export class SearchMuestrasHandler {
  constructor(private readonly useCase: SearchMuestrasUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<MuestraPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
