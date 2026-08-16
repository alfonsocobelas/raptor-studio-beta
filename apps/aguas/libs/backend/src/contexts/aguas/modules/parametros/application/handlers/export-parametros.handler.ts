import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ParametroPrimitiveProps } from '../../domain/parametro-types'
import { ExportParametrosUseCase } from '../use-cases/export-parametros-usecase.service'

@Injectable()
export class ExportParametrosHandler {
  constructor(private readonly useCase: ExportParametrosUseCase) {}

  async handle(input: UnpaginatedInput): Promise<ParametroPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
