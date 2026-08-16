import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { PuntoId } from '../../../../../shared/domain/value-objects/puntos/punto-id.vo'
import { PuntoRepository } from '../../domain/punto-repository'
import { PuntoPrimitiveProps } from '../../domain/punto-types'
import { GetPuntoInput } from '../dtos/get-punto-input.dto'

@Injectable()
export class GetPuntoUseCase {
  constructor(private readonly puntoRepository: PuntoRepository) {}

  async invoke(input: GetPuntoInput): Promise<PuntoPrimitiveProps> {
    const puntoId = PuntoId.create(input.id)
    const punto = await this.puntoRepository.get(puntoId)

    if (!punto) {
      throw new EntityNotFoundError('Punto', input.id)
    }

    return punto.toPrimitives()
  }
}
