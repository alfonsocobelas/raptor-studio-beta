import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ClientId } from '../../../../../shared/domain/value-objects/clients/client-id.vo'
import { ClientRepository } from '../../domain/client-repository'
import { RemoveClientInput } from '../dtos/remove-client-input.dto'

@Injectable()
export class RemoveClientUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async invoke(input: RemoveClientInput): Promise<void> {
    const clientId = ClientId.create(input.id)
    const client = await this.clientRepository.get(clientId)

    if (!client) {
      throw new EntityNotFoundError('Client', input.id)
    }

    await this.clientRepository.remove(clientId)
  }
}
