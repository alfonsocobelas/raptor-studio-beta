import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { PuntoRepository } from '../../domain/punto-repository'
import { PuntoId } from '../../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { UpdatePuntoInput } from '../dtos/update-punto-input.dto'

@Injectable()
export class UpdatePuntoUseCase {
  constructor(private readonly puntoRepository: PuntoRepository) {}

  async invoke(input: UpdatePuntoInput): Promise<void> {
    const puntoId = PuntoId.create(input.id)
    const punto = await this.puntoRepository.get(puntoId)

    if (!punto) {
      throw new EntityNotFoundError('Punto', input.id)
    }

    punto.updateDetails(input.updates)
    await this.puntoRepository.save(punto)
  }
}
