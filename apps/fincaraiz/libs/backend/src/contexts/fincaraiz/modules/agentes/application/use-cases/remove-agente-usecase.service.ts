import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { AgenteId } from '../../../../../shared/domain/value-objects/agentes/agente-id.vo'
import { AgenteRepository } from '../../domain/agente-repository'
import { RemoveAgenteInput } from '../dtos/remove-agente-input.dto'

@Injectable()
export class RemoveAgenteUseCase {
  constructor(private readonly agenteRepository: AgenteRepository) {}

  async invoke(input: RemoveAgenteInput): Promise<void> {
    const agenteId = AgenteId.create(input.id)
    const agente = await this.agenteRepository.get(agenteId)

    if (!agente) {
      throw new EntityNotFoundError('Agente', input.id)
    }

    await this.agenteRepository.remove(agenteId)
  }
}
