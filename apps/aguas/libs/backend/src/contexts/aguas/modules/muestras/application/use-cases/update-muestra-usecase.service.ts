import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { MuestraRepository } from '../../domain/muestra-repository'
import { MuestraId } from '../../../../../shared/domain/value-objects/muestras/muestra-id.vo'
import { UpdateMuestraInput } from '../dtos/update-muestra-input.dto'

@Injectable()
export class UpdateMuestraUseCase {
  constructor(private readonly muestraRepository: MuestraRepository) {}

  async invoke(input: UpdateMuestraInput): Promise<void> {
    const muestraId = MuestraId.create(input.id)
    const muestra = await this.muestraRepository.get(muestraId)

    if (!muestra) {
      throw new EntityNotFoundError('Muestra', input.id)
    }

    muestra.updateDetails(input.updates)
    await this.muestraRepository.save(muestra)
  }
}
