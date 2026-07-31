import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ClientId } from '../../../../../shared/domain/value-objects/clients/client-id.vo'
import { ClientRepository } from '../../domain/client-repository'
import { ClientPrimitiveProps } from '../../domain/client-types'
import { GetClientInput } from '../dtos/get-client-input.dto'

@Injectable()
export class GetClientUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async invoke(input: GetClientInput): Promise<ClientPrimitiveProps> {
    const clientId = ClientId.create(input.id)
    const client = await this.clientRepository.get(clientId)

    if (!client) {
      throw new EntityNotFoundError('Client', input.id)
    }

    return client.toPrimitives()
  }
}
