import { Injectable } from '@nestjs/common'
import { AlreadyExistsError, EntityNotFoundError } from '../../../../../shared/domain/errors'
import { ClientRepository } from '../../domain/client-repository'
import { withTaxId } from '../../domain/specifications/client-with-tax-id.specification'
import { ClientId } from '../../../../../shared/domain/value-objects/clients/client-id.vo'
import { UpdateClientInput } from '../dtos/update-client-input.dto'

@Injectable()
export class UpdateClientUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async invoke(input: UpdateClientInput): Promise<void> {
    const clientId = ClientId.create(input.id)
    const client = await this.clientRepository.get(clientId)

    if (!client) {
      throw new EntityNotFoundError('Client', input.id)
    }

    const newTaxId = client.newTaxIdIfChanged(input.updates)

    if (newTaxId) {
      const taxIdExists = await this.clientRepository.exists(withTaxId(newTaxId))

      if (taxIdExists) {
        throw new AlreadyExistsError('Client', 'taxId', newTaxId.value)
      }
    }

    client.updateDetails(input.updates)
    await this.clientRepository.save(client)
  }
}
