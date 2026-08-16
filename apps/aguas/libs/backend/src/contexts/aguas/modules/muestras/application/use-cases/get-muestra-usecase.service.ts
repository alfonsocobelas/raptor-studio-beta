import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { MuestraId } from '../../../../../shared/domain/value-objects/muestras/muestra-id.vo'
import { MuestraRepository } from '../../domain/muestra-repository'
import { MuestraPrimitiveProps } from '../../domain/muestra-types'
import { GetMuestraInput } from '../dtos/get-muestra-input.dto'

@Injectable()
export class GetMuestraUseCase {
  constructor(private readonly muestraRepository: MuestraRepository) {}

  async invoke(input: GetMuestraInput): Promise<MuestraPrimitiveProps> {
    const muestraId = MuestraId.create(input.id)
    const muestra = await this.muestraRepository.get(muestraId)

    if (!muestra) {
      throw new EntityNotFoundError('Muestra', input.id)
    }

    return muestra.toPrimitives()
  }
}
