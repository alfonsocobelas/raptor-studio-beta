import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { AgenteRepository } from '../../domain/agente-repository'
import { AgenteId } from '../../../../../shared/domain/value-objects/agentes/agente-id.vo'
import { UpdateAgenteInput } from '../dtos/update-agente-input.dto'

@Injectable()
export class UpdateAgenteUseCase {
  constructor(private readonly agenteRepository: AgenteRepository) {}

  async invoke(input: UpdateAgenteInput): Promise<void> {
    const agenteId = AgenteId.create(input.id)
    const agente = await this.agenteRepository.get(agenteId)

    if (!agente) {
      throw new EntityNotFoundError('Agente', input.id)
    }

    agente.updateDetails(input.updates)
    await this.agenteRepository.save(agente)
  }
}
