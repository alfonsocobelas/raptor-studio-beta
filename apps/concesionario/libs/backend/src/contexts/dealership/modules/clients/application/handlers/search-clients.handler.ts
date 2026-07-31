import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { ClientPrimitiveProps } from '../../domain/client-types'
import { SearchClientsUseCase } from '../use-cases/search-clients-usecase.service'

@Injectable()
export class SearchClientsHandler {
  constructor(private readonly useCase: SearchClientsUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<ClientPrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
