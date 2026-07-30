import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { MovementPrimitiveProps } from '../../domain/movement-types'
import { ExportMovementsUseCase } from '../use-cases/export-movements-usecase.service'

@Injectable()
export class ExportMovementsHandler {
  constructor(private readonly useCase: ExportMovementsUseCase) {}

  async handle(input: UnpaginatedInput): Promise<MovementPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
