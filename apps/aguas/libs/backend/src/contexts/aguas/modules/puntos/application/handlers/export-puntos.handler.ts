import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { PuntoPrimitiveProps } from '../../domain/punto-types'
import { ExportPuntosUseCase } from '../use-cases/export-puntos-usecase.service'

@Injectable()
export class ExportPuntosHandler {
  constructor(private readonly useCase: ExportPuntosUseCase) {}

  async handle(input: UnpaginatedInput): Promise<PuntoPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
