import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { PropiedadPrimitiveProps } from '../../domain/propiedad-types'
import { SearchPropiedadesUseCase } from '../use-cases/search-propiedades-usecase.service'

@Injectable()
export class SearchPropiedadesHandler {
  constructor(private readonly useCase: SearchPropiedadesUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<PropiedadPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
