import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { MuestraPrimitiveProps } from '../../domain/muestra-types'
import { ExportMuestrasUseCase } from '../use-cases/export-muestras-usecase.service'

@Injectable()
export class ExportMuestrasHandler {
  constructor(private readonly useCase: ExportMuestrasUseCase) {}

  async handle(input: UnpaginatedInput): Promise<MuestraPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
