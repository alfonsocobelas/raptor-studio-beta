import { Movement } from '../../../../../src/contexts/warehouse/modules/movements/domain/movement'
import { MovementPrimitiveProps } from '../../../../../src/contexts/warehouse/modules/movements/domain/movement-types'
import { MovementBuilder } from './movement.builder'

export class MovementMother {
  static random(): Movement {
    return MovementBuilder.aMovement().build()
  }

  static randomList(count: number = 5): Movement[] {
    return Array.from({ length: count }, () => this.random())
  }

  static register(overrides?: Partial<MovementPrimitiveProps>): Movement {
    return MovementBuilder.aMovement().withProps(overrides).create()
  }

  static reconstruct(overrides?: Partial<MovementPrimitiveProps>): Movement {
    return MovementBuilder.aMovement().withProps(overrides).build()
  }

  static withReference(reference: string): Movement {
    return MovementBuilder.aMovement().withReference(reference).build()
  }

  static primitives(overrides?: Partial<MovementPrimitiveProps>): MovementPrimitiveProps {
    return MovementBuilder.aMovement().withProps(overrides).build().toPrimitives()
  }
}
