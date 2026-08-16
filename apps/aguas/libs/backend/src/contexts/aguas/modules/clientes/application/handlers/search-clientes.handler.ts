import { Injectable } from '@nestjs/common'
import { OffsetPaginatedOutput } from '../../../../../shared/application/dtos/search-output.dto'
import { OffsetInput } from '../../../../../shared/domain/query/criteria'
import { ClientePrimitiveProps } from '../../domain/cliente-types'
import { SearchClientesUseCase } from '../use-cases/search-clientes-usecase.service'

@Injectable()
export class SearchClientesHandler {
  constructor(private readonly useCase: SearchClientesUseCase) {}

  async handle(input: OffsetInput): Promise<OffsetPaginatedOutput<ClientePrimitiveProps>> {
    return this.useCase.invoke(input)
  }
}
