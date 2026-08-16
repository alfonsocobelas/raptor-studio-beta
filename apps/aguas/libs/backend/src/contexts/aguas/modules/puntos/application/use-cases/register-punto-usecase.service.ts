import { Injectable } from '@nestjs/common'
import { Punto } from '../../domain/punto'
import { PuntoRepository } from '../../domain/punto-repository'
import { RegisterPuntoInput } from '../dtos/register-punto-input.dto'

@Injectable()
export class RegisterPuntoUseCase {
  constructor(private readonly puntoRepository: PuntoRepository) {}

  async invoke(input: RegisterPuntoInput): Promise<void> {
    const punto = Punto.register(input)
    await this.puntoRepository.register(punto)
  }
}
