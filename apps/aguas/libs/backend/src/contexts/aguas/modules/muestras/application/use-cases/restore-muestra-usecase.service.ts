import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { MuestraId } from '../../../../../shared/domain/value-objects/muestras/muestra-id.vo'
import { MuestraRepository } from '../../domain/muestra-repository'
import { RestoreMuestraInput } from '../dtos/restore-muestra-input.dto'

@Injectable()
export class RestoreMuestraUseCase {
  constructor(private readonly muestraRepository: MuestraRepository) {}

  async invoke(input: RestoreMuestraInput): Promise<void> {
    const restored = await this.muestraRepository.restore(MuestraId.create(input.id))

    if (!restored) {
      throw new EntityNotFoundError('Muestra', input.id)
    }
  }
}
