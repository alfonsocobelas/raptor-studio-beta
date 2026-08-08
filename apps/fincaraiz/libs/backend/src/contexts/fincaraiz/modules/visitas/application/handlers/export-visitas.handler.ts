import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { VisitaPrimitiveProps } from '../../domain/visita-types'
import { ExportVisitasUseCase } from '../use-cases/export-visitas-usecase.service'

@Injectable()
export class ExportVisitasHandler {
  constructor(private readonly useCase: ExportVisitasUseCase) {}

  async handle(input: UnpaginatedInput): Promise<VisitaPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
