import { Injectable } from '@nestjs/common'
import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { Client } from '../../domain/client'
import { ClientRepository } from '../../domain/client-repository'
import { withTaxId } from '../../domain/specifications/client-with-tax-id.specification'
import { RegisterClientInput } from '../dtos/register-client-input.dto'

@Injectable()
export class RegisterClientUseCase {
  constructor(private readonly clientRepository: ClientRepository) {}

  async invoke(input: RegisterClientInput): Promise<void> {
    const client = Client.register(input)
    const taxIdExists = await this.clientRepository.exists(withTaxId(client.taxId))

    if (taxIdExists) {
      throw new AlreadyExistsError('Client', 'taxId', client.taxId.value)
    }

    await this.clientRepository.register(client)
  }
}
