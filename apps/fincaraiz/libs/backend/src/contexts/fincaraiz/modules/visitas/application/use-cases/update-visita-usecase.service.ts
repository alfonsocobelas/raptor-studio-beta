import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { VisitaRepository } from '../../domain/visita-repository'
import { VisitaId } from '../../../../../shared/domain/value-objects/visitas/visita-id.vo'
import { UpdateVisitaInput } from '../dtos/update-visita-input.dto'

@Injectable()
export class UpdateVisitaUseCase {
  constructor(private readonly visitaRepository: VisitaRepository) {}

  async invoke(input: UpdateVisitaInput): Promise<void> {
    const visitaId = VisitaId.create(input.id)
    const visita = await this.visitaRepository.get(visitaId)

    if (!visita) {
      throw new EntityNotFoundError('Visita', input.id)
    }

    visita.updateDetails(input.updates)
    await this.visitaRepository.save(visita)
  }
}
