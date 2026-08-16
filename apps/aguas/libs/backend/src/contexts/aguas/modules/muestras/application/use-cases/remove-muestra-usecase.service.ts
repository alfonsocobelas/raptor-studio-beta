import { Injectable } from '@nestjs/common'
import { EntityNotFoundError } from '../../../../../shared/domain/errors'
import { DeleteOperationId } from '../../../../../shared/domain/value-objects/delete-operation-id.vo'
import { MuestraId } from '../../../../../shared/domain/value-objects/muestras/muestra-id.vo'
import { MuestraRepository } from '../../domain/muestra-repository'
import { RemoveMuestraInput } from '../dtos/remove-muestra-input.dto'

@Injectable()
export class RemoveMuestraUseCase {
  constructor(private readonly muestraRepository: MuestraRepository) {}

  async invoke(input: RemoveMuestraInput): Promise<void> {
    const muestraId = MuestraId.create(input.id)
    const muestra = await this.muestraRepository.get(muestraId)

    if (!muestra) {
      throw new EntityNotFoundError('Muestra', input.id)
    }

    // La operación identifica ESTE borrado: restaurar revertirá exactamente lo que arrastre
    const op = DeleteOperationId.random()
    await this.muestraRepository.remove(muestraId, op)
  }
}
