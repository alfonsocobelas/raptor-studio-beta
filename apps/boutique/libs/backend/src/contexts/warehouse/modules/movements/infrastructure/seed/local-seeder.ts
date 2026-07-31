import { AlreadyExistsError } from '../../../../../shared/domain/errors'
import { RegisterMovementInput } from '../../application/dtos/register-movement-input.dto'
import { RegisterMovementUseCase } from '../../application/use-cases/register-movement-usecase.service'

export interface MovementSeedSummary {
  movementsCreated: number
  movementsSkipped: number
}

// Siembra idempotente de movements para el entorno local vía RegisterMovementUseCase
// (respeta invariantes); los duplicados se saltan capturando AlreadyExistsError.
export class MovementLocalSeeder {
  constructor(private readonly registerMovement: RegisterMovementUseCase) {}

  async seed(movements: RegisterMovementInput[]): Promise<MovementSeedSummary> {
    const summary: MovementSeedSummary = {
      movementsCreated: 0,
      movementsSkipped: 0
    }

    for (const movement of movements) {
      try {
        await this.registerMovement.invoke(movement)
        summary.movementsCreated++
      } catch (error) {
        if (error instanceof AlreadyExistsError) {
          summary.movementsSkipped++
          continue
        }
        throw error
      }
    }

    return summary
  }
}
