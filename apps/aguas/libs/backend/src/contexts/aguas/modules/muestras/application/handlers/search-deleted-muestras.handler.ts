import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { MuestraPrimitiveProps } from '../../domain/muestra-types'
import { SearchDeletedMuestrasUseCase } from '../use-cases/search-deleted-muestras-usecase.service'

@Injectable()
export class SearchDeletedMuestrasHandler {
  constructor(private readonly useCase: SearchDeletedMuestrasUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<MuestraPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
