import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { PropiedadPrimitiveProps } from '../../domain/propiedad-types'
import { ExportPropiedadesUseCase } from '../use-cases/export-propiedades-usecase.service'

@Injectable()
export class ExportPropiedadesHandler {
  constructor(private readonly useCase: ExportPropiedadesUseCase) {}

  async handle(input: UnpaginatedInput): Promise<PropiedadPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
