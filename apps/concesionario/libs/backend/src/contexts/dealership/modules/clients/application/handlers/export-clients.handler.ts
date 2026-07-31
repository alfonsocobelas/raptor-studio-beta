import { Injectable } from '@nestjs/common'
import { UnpaginatedInput } from '../../../../../shared/domain/query/criteria'
import { ClientPrimitiveProps } from '../../domain/client-types'
import { ExportClientsUseCase } from '../use-cases/export-clients-usecase.service'

@Injectable()
export class ExportClientsHandler {
  constructor(private readonly useCase: ExportClientsUseCase) {}

  async handle(input: UnpaginatedInput): Promise<ClientPrimitiveProps[]> {
    return this.useCase.invoke(input)
  }
}
