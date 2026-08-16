import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ClientePrimitiveProps } from '../../domain/cliente-types'
import { ExportClientesUseCase } from '../use-cases/export-clientes-usecase.service'

@Injectable()
export class ExportClientesHandler {
  constructor(private readonly useCase: ExportClientesUseCase) {}

  async handle(input: UnpaginatedInput): Promise<ClientePrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
